#!/usr/bin/env python3
"""Route a user request through the ServiceNow Tier 1 -> Tier 2 -> Tier 3 pipeline.

This runner intentionally mirrors the project flow:
1. Tier 1 FAQ lookup via faq_snow_query.py
2. Tier 2 spaCy reasoning via spacy_servicenow_query.py
3. Tier 3 Ollama reasoning via ollama_servicenow_query.py

The script emits a single JSON object describing the selected tier, the final
text, and any tabular ServiceNow results so the chat application can display it.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from faq_logging import log_operation
from faq_query import connect_database, load_settings

PROJECT_DIR = Path(__file__).resolve().parent
DEFAULT_DB_CONFIG = PROJECT_DIR / "secrent" / "db_config.cfg"
DEFAULT_SNOW_CONFIG = PROJECT_DIR / "secrent" / "snow.config"


def safe_json_loads(raw: str) -> Any:
    """Parse a JSON payload from stdout, tolerating surrounding diagnostics."""
    text = (raw or "").strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        for start_marker in ("{", "["):
            start = text.find(start_marker)
            if start == -1:
                continue
            end = text.rfind(start_marker.replace("{", "}").replace("[", "]"))
            if start_marker == "{":
                candidate_end = text.rfind("}")
            else:
                candidate_end = text.rfind("]")
            if candidate_end > start:
                candidate = text[start : candidate_end + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    continue
        return None


def normalize_records(payload: Any) -> list[dict[str, Any]]:
    """Return a flat list of ServiceNow rows from the tier output."""
    if isinstance(payload, dict) and any(key in payload for key in ("number", "sys_id", "short_description")):
        return [payload]
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("results", "result", "rows", "tableData", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def has_valid_result(payload: Any) -> bool:
    """Return True only when the tier payload contains actual ServiceNow data."""
    if payload is None:
        return False
    return bool(normalize_records(payload))


def summarize_records(records: list[dict[str, Any]]) -> str:
    """Create a short human-readable summary for the selected tier result."""
    if not records:
        return "No rows returned"
    first = records[0]
    number = first.get("number") or first.get("incidentNumber") or first.get("incident_number") or first.get("id") or "record"
    short_description = (
        first.get("short_description")
        or first.get("shortDescription")
        or first.get("description")
        or first.get("summary")
        or "ServiceNow response"
    )
    return f"Found {len(records)} result(s). {number} — {short_description}"


def run_tier_script(script_path: Path, *args: str) -> dict[str, Any]:
    """Execute one tier script synchronously and block until it exits.

    This is intentionally a blocking call so Tier 1 must fully complete before
    the router decides whether to fall through to Tier 2 or Tier 3.
    """
    process = subprocess.run(
        [sys.executable, str(script_path), *args],
        capture_output=True,
        text=True,
        cwd=str(script_path.parent),
        timeout=90,
    )
    output = (process.stdout or "").strip()
    payload = safe_json_loads(output)
    return {
        "script": script_path.name,
        "returncode": process.returncode,
        "stdout": output,
        "stderr": (process.stderr or "").strip(),
        "payload": payload,
    }


def audit_agent_event(connection: Any, user_name: str, details: str, table: str) -> None:
    """Record runner transitions without hiding the tier result on log failure."""
    if connection is not None:
        log_operation(connection, user_name, details, table)


def build_response(tier_name: str, payload: Any, request: str) -> dict[str, Any]:
    """Normalize a tier payload into the response contract consumed by the chat UI."""
    records = normalize_records(payload)
    if not records:
        return {
            "tier": tier_name,
            "status": "empty",
            "text": f"{tier_name} returned no matching ServiceNow result for: {request}",
            "tableData": [],
        }

    summary = summarize_records(records)
    return {
        "tier": tier_name,
        "status": "success",
        "text": f"Resolved by {tier_name}. {summary}",
        "tableData": records,
    }


def route_request(user_request: str, user_name: str = "unknown") -> dict[str, Any]:
    """Try Tier 1, then Tier 2, then Tier 3 until one yields data."""
    tier_scripts = [
        (
            "Tier 1",
            PROJECT_DIR / "faq_snow_query.py",
            [
                "--query",
                user_request,
                "--user-name",
                user_name,
                "--db-config",
                str(DEFAULT_DB_CONFIG),
                "--snow-config",
                str(DEFAULT_SNOW_CONFIG),
            ],
        ),
        (
            "Tier 2",
            PROJECT_DIR / "spacy_servicenow_query.py",
            [
                "--query",
                user_request,
                "--user-name",
                user_name,
                "--db-config",
                str(DEFAULT_DB_CONFIG),
                "--snow-config",
                str(DEFAULT_SNOW_CONFIG),
                "--execute",
            ],
        ),
        (
            "Tier 3",
            PROJECT_DIR / "ollama_servicenow_query.py",
            [
                "--query",
                user_request,
                "--user-name",
                user_name,
                "--db-config",
                str(DEFAULT_DB_CONFIG),
                "--snow-config",
                str(DEFAULT_SNOW_CONFIG),
                "--execute",
            ],
        ),
    ]

    connection = None
    logging_table = "faq_agent_logging"
    try:
        db_settings = load_settings(DEFAULT_DB_CONFIG)
        logging_table = db_settings.logging_table
        connection = connect_database(db_settings)
        audit_agent_event(connection, user_name, "START tier_agent.route_request", logging_table)
    except Exception as error:
        print(f"Tier agent audit logging unavailable: {error}", file=sys.stderr)

    try:
        for tier_name, script_path, script_args in tier_scripts:
            audit_agent_event(
                connection,
                user_name,
                f"STEP: START {tier_name}; script={script_path.name}; query={user_request}",
                logging_table,
            )
            audit_agent_event(connection, user_name, f"PROCESSING tier_agent: {tier_name}; script={script_path.name}", logging_table)
            print(
                json.dumps({"event": "tier_status", "tier": tier_name, "status": "processing"}),
                file=sys.stderr,
                flush=True,
            )

            try:
                # Synchronous blocking call: wait until the tier script fully completes
                # and returns its API/DB response before evaluating whether to continue.
                result = run_tier_script(script_path, *script_args)
                payload = result.get("payload")
                records = normalize_records(payload)

                if records:
                    audit_agent_event(
                        connection,
                        user_name,
                        f"STEP: {tier_name} returned valid result; rows={len(records)}; summary={summarize_records(records)}",
                        logging_table,
                    )
                    audit_agent_event(connection, user_name, f"SUCCESS tier_agent: {tier_name}; rows={len(records)}", logging_table)
                    print(
                        json.dumps({"event": "tier_status", "tier": tier_name, "status": "success"}),
                        file=sys.stderr,
                        flush=True,
                    )
                    return build_response(tier_name, payload, user_request)

                audit_agent_event(
                    connection,
                    user_name,
                    f"STEP: {tier_name} returned no rows; returncode={result.get('returncode')}; stderr={result.get('stderr', '')[:500]}; moving_to_next_tier=True",
                    logging_table,
                )
                audit_agent_event(
                    connection,
                    user_name,
                    f"NO_RESULT tier_agent: {tier_name}; returncode={result.get('returncode')}; stderr={result.get('stderr', '')[:500]}",
                    logging_table,
                )
                print(
                    json.dumps({"event": "tier_status", "tier": tier_name, "status": "empty"}),
                    file=sys.stderr,
                    flush=True,
                )
                continue
            except Exception as error:
                audit_agent_event(
                    connection,
                    user_name,
                    f"STEP: {tier_name} raised exception; error={type(error).__name__}: {error}; moving_to_next_tier=True",
                    logging_table,
                )
                audit_agent_event(connection, user_name, f"ERROR tier_agent: {tier_name}; {type(error).__name__}: {error}", logging_table)
                print(
                    json.dumps({"event": "tier_status", "tier": tier_name, "status": "error", "error": str(error)}),
                    file=sys.stderr,
                    flush=True,
                )
                continue
    finally:
        if connection is not None:
            connection.close()

    return {
        "tier": "Tier 3",
        "status": "empty",
        "text": f"No ServiceNow match was found after checking Tier 1, Tier 2, and Tier 3 for: {user_request}",
        "tableData": [],
    }

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--query", required=True, help="User request from the chat bot")
    parser.add_argument("--user-name", default="unknown", help="Current chat user")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = route_request(args.query, args.user_name)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except Exception as error:
        print(json.dumps({"tier": "Tier 3", "status": "error", "text": str(error), "tableData": []}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
