from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import db


class DbRetryTests(unittest.TestCase):
    def test_connect_retries_transient_operational_error(self):
        fake_conn = object()
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "postgresql://example.invalid/db",
                "DB_CONNECT_RETRIES": "3",
                "DB_CONNECT_RETRY_DELAY_SECONDS": "0",
                "DB_CONNECT_TIMEOUT_SECONDS": "7",
            },
        ):
            with patch("db.time.sleep") as sleep, patch(
                "db.psycopg.connect",
                side_effect=[db.psycopg.OperationalError("temporary"), fake_conn],
            ) as connect:
                conn = db.connect()

        self.assertIs(conn, fake_conn)
        self.assertEqual(connect.call_count, 2)
        self.assertEqual(connect.call_args.kwargs["connect_timeout"], 7)
        sleep.assert_called_once_with(0.0)

    def test_connect_raises_after_retry_limit(self):
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "postgresql://example.invalid/db",
                "DB_CONNECT_RETRIES": "2",
                "DB_CONNECT_RETRY_DELAY_SECONDS": "0",
            },
        ):
            with patch("db.time.sleep"), patch(
                "db.psycopg.connect",
                side_effect=db.psycopg.OperationalError("still down"),
            ) as connect:
                with self.assertRaisesRegex(db.psycopg.OperationalError, "still down"):
                    db.connect()

        self.assertEqual(connect.call_count, 2)


if __name__ == "__main__":
    unittest.main()
