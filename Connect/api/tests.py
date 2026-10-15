from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
from datetime import date
from .models import AstronomicalEvent


class ChatAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()

    @patch('api.views._groq_client')
    def test_chat_api_response(self, mock_groq_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Sirius is the brightest star in the night sky."
        mock_groq_client.chat.completions.create.return_value = mock_response

        data = {
            'message': 'Tell me about Sirius',
            'star': {
                'name': 'Sirius',
                'bv': 0.0,
                'vmag': -1.46,
                'distance': 2.64,
                'ra': '06h45m08.9s',
                'dec': '-16°42′46″'
            }
        }

        response = self.client.post('/api/chat/', data, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('reply', response.data)
        self.assertEqual(response.data['reply'], "Sirius is the brightest star in the night sky.")
        mock_groq_client.chat.completions.create.assert_called_once()
        self.assertEqual(
            mock_groq_client.chat.completions.create.call_args.kwargs['model'],
            'openai/gpt-oss-120b',
        )


class EventTest(TestCase):

    def test_create_event(self):
        event = AstronomicalEvent.objects.create(
            name='Solar Eclipse 2026',
            description='A total solar eclipse visible from North America',
            event_date=date(2026, 8, 12),
            is_active=True
        )

        self.assertEqual(event.name, 'Solar Eclipse 2026')
        self.assertEqual(event.description, 'A total solar eclipse visible from North America')
        self.assertEqual(event.event_date, date(2026, 8, 12))
        self.assertTrue(event.is_active)
        self.assertIsNotNone(event.created_at)
        self.assertEqual(str(event), 'Solar Eclipse 2026 (2026-08-12)')

    def test_active_events_only(self):
        initial_active_count = AstronomicalEvent.objects.filter(is_active=True).count()

        AstronomicalEvent.objects.create(
            name='Active Event Test',
            description='This is active',
            event_date=date(2026, 6, 1),
            is_active=True
        )

        AstronomicalEvent.objects.create(
            name='Inactive Event Test',
            description='This is inactive',
            event_date=date(2026, 7, 1),
            is_active=False
        )

        active_events = AstronomicalEvent.objects.filter(is_active=True)
        self.assertEqual(active_events.count(), initial_active_count + 1)
        self.assertTrue(active_events.filter(name='Active Event Test').exists())
        self.assertFalse(active_events.filter(name='Inactive Event Test').exists())
