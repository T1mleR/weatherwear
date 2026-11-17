import unittest
from oncall import sanitized_alert, respond_to_alert


class OnCallTests(unittest.TestCase):
    def test_sanitization_excludes_secrets(self):
        alert = {
            "labels": {
                "alertname": "WeatherSearchFailures",
                "severity": "warning",
                "token": "do-not-leak",
            },
            "annotations": {"summary": "Too many errors"},
        }
        result = sanitized_alert(alert)
        self.assertNotIn("token", result["labels"])
        self.assertEqual(result["labels"]["alertname"], "WeatherSearchFailures")

    def test_ai_agent_read_only_incident(self):
        model = lambda prompt: {"response": "Check Open-Meteo connectivity and notify owner"}
        response = respond_to_alert({"labels": {"alertname": "WeatherSearchFailures"}}, model)
        self.assertEqual(response["analysis_mode"], "ai_ollama")
        self.assertIn("connectivity", response["analysis"])


if __name__ == "__main__":
    unittest.main()
