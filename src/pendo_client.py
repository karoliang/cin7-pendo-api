"""
Pendo.io API Client
A comprehensive Python client for interacting with Pendo.io's API
"""

import os
import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class PendoAPIClient:
    """
    Main Pendo.io API Client

    Handles authentication, request management, and all API interactions
    """

    def __init__(self, api_key: str = None, base_url: str = None):
        """
        Initialize the Pendo API client

        Args:
            api_key: Pendo integration key
            base_url: Base URL for Pendo API
        """
        self.api_key = api_key or os.getenv('PENDO_API_KEY')
        self.base_url = base_url or os.getenv('PENDO_BASE_URL', 'https://api.pendo.io')

        if not self.api_key:
            raise ValueError("API key is required. Set PENDO_API_KEY environment variable or pass api_key parameter")

        self.session = requests.Session()
        self.session.headers.update({
            'X-Pendo-Integration-Key': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

        # Setup logging
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to Pendo API

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint
            **kwargs: Additional request parameters

        Returns:
            Response data as dictionary
        """
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()

            self.logger.info(f"Successful {method} request to {endpoint}")
            return response.json()

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request failed: {e}")

            # Try to get error details from response
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    raise PendoAPIError(error_data.get('error', str(e)))
                except json.JSONDecodeError:
                    raise PendoAPIError(f"HTTP {e.response.status_code}: {e.response.text}")

            raise PendoAPIError(str(e))

    def get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make GET request"""
        return self._make_request('GET', endpoint, params=params)

    def post(self, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make POST request"""
        return self._make_request('POST', endpoint, json=data)

    def put(self, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make PUT request"""
        return self._make_request('PUT', endpoint, json=data)

    def delete(self, endpoint: str) -> Dict[str, Any]:
        """Make DELETE request"""
        return self._make_request('DELETE', endpoint)

    # Campaign Management Methods
    def list_campaigns(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """List all campaigns"""
        params = {'limit': limit, 'offset': offset}
        return self.get('/api/v1/campaigns', params=params)

    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new campaign"""
        return self.post('/api/v1/campaigns', data=campaign_data)

    def get_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Get specific campaign details"""
        return self.get(f'/api/v1/campaigns/{campaign_id}')

    def update_campaign(self, campaign_id: str, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing campaign"""
        return self.put(f'/api/v1/campaigns/{campaign_id}', data=campaign_data)

    def delete_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Delete a campaign"""
        return self.delete(f'/api/v1/campaigns/{campaign_id}')

    def get_campaign_analytics(self, campaign_id: str) -> Dict[str, Any]:
        """Get campaign performance analytics"""
        return self.get(f'/api/v1/campaigns/{campaign_id}/analytics')

    # Analytics Methods
    def get_user_analytics(self, user_id: str = None) -> Dict[str, Any]:
        """Get user behavior analytics"""
        endpoint = f'/api/v1/analytics/users/{user_id}' if user_id else '/api/v1/analytics/users'
        return self.get(endpoint)

    def get_feature_analytics(self) -> Dict[str, Any]:
        """Get feature adoption analytics"""
        return self.get('/api/v1/analytics/features')

    def track_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Track custom event"""
        return self.post('/api/v1/events', data=event_data)

    def get_events(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Retrieve event data"""
        params = {'limit': limit, 'offset': offset}
        return self.get('/api/v1/events', params=params)

    # Feedback Methods
    def list_feedback(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """List feedback submissions"""
        params = {'limit': limit, 'offset': offset}
        return self.get('/api/v1/feedback', params=params)

    def submit_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit new feedback"""
        return self.post('/api/v1/feedback', data=feedback_data)

    def get_sentiment_analysis(self) -> Dict[str, Any]:
        """Get sentiment analysis data"""
        return self.get('/api/v1/feedback/sentiment')

    def get_nps_scores(self) -> Dict[str, Any]:
        """Get NPS scores and trends"""
        return self.get('/api/v1/feedback/nps')

    # Metadata Methods
    def list_users(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """List users"""
        params = {'limit': limit, 'offset': offset}
        return self.get('/api/v1/users', params=params)

    def create_or_update_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update user metadata"""
        return self.post('/api/v1/users', data=user_data)

    def get_user(self, user_id: str) -> Dict[str, Any]:
        """Get specific user details"""
        return self.get(f'/api/v1/users/{user_id}')

    def list_accounts(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """List accounts"""
        params = {'limit': limit, 'offset': offset}
        return self.get('/api/v1/accounts', params=params)

    def create_or_update_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update account metadata"""
        return self.post('/api/v1/accounts', data=account_data)

    # Guide Management Methods
    def list_guides(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """List guides"""
        params = {'limit': limit, 'offset': offset}
        return self.get('/api/v1/guides', params=params)

    def create_guide(self, guide_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new guide"""
        return self.post('/api/v1/guides', data=guide_data)

    def get_guide_analytics(self, guide_id: str) -> Dict[str, Any]:
        """Get guide performance analytics"""
        return self.get(f'/api/v1/guides/{guide_id}/analytics')

    # Utility Methods
    def test_connection(self) -> bool:
        """Test API connection and authentication"""
        try:
            response = self.get('/api/v1/users', params={'limit': 1})
            return True
        except PendoAPIError:
            return False

    def get_rate_limit_info(self) -> Dict[str, Any]:
        """Get current rate limit information"""
        # This would need to be implemented based on actual API response headers
        return self.get('/api/v1/rate-limit')


class PendoAPIError(Exception):
    """Custom exception for Pendo API errors"""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


# Convenience function for easy client initialization
def create_client() -> PendoAPIClient:
    """Create Pendo API client from environment variables"""
    return PendoAPIClient()


if __name__ == "__main__":
    # Example usage
    client = create_client()

    # Test connection
    if client.test_connection():
        print("✅ Successfully connected to Pendo API")

        # List campaigns
        campaigns = client.list_campaigns(limit=5)
        print(f"Found {len(campaigns.get('data', []))} campaigns")

        # Get user analytics
        analytics = client.get_user_analytics()
        print("Analytics data retrieved")

    else:
        print("❌ Failed to connect to Pendo API")