"""
Pendo.io API Client v2 - Production Ready
Updated with discovered working endpoints and base URL
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


class PendoAPIClientV2:
    """
    Production-Ready Pendo.io API Client

    Based on comprehensive exploration and discovery of working endpoints.
    Uses the correct base URL and endpoint structure.
    """

    def __init__(self, api_key: str = None, base_url: str = None):
        """
        Initialize the Pendo API client with working configuration

        Args:
            api_key: Pendo integration key
            base_url: Working Pendo API base URL
        """
        self.api_key = api_key or os.getenv('PENDO_API_KEY')
        self.base_url = base_url or os.getenv('PENDO_BASE_URL', 'https://app.pendo.io')

        if not self.api_key:
            raise ValueError("API key is required. Set PENDO_API_KEY environment variable or pass api_key parameter")

        self.session = requests.Session()
        self.session.headers.update({
            'X-Pendo-Integration-Key': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Pendo-API-Client-V2/1.0'
        })

        # Setup logging
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to Pendo API with enhanced error handling

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint
            **kwargs: Additional request parameters

        Returns:
            Response data as dictionary
        """
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(method, url, timeout=15, **kwargs)
            response.raise_for_status()

            self.logger.info(f"Successful {method} request to {endpoint}")
            return response.json()

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request failed: {e}")

            # Enhanced error handling
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    raise PendoAPIError(error_data.get('message', str(e)), e.response.status_code)
                except json.JSONDecodeError:
                    raise PendoAPIError(f"HTTP {e.response.status_code}: {e.response.text[:200]}", e.response.status_code)

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

    # Working Guide Management Methods
    def list_guides(self) -> Dict[str, Any]:
        """
        List all guides (WORKING ENDPOINT)

        Returns:
            Dictionary containing list of guides
        """
        return self.get('/api/v1/guide')

    def get_guide_schema(self) -> Dict[str, Any]:
        """
        Get guide metadata schema (WORKING ENDPOINT)

        Returns:
            Dictionary containing guide schema definition
        """
        return self.get('/api/v1/metadata/schema/guide')

    # Working Feature Management Methods
    def list_features(self) -> Dict[str, Any]:
        """
        List all features (WORKING ENDPOINT)

        Returns:
            Dictionary containing list of features with analytics data
        """
        return self.get('/api/v1/feature')

    # Working Page Management Methods
    def list_pages(self) -> Dict[str, Any]:
        """
        List all pages (WORKING ENDPOINT)

        Returns:
            Dictionary containing list of pages with analytics data
        """
        return self.get('/api/v1/page')

    # Working Report Methods
    def list_reports(self) -> Dict[str, Any]:
        """
        List all reports (WORKING ENDPOINT)

        Returns:
            Dictionary containing list of available reports
        """
        return self.get('/api/v1/report')

    # Working Metadata Methods
    def get_visitor_metadata_schema(self) -> Dict[str, Any]:
        """
        Get visitor metadata schema (WORKING ENDPOINT)

        Returns:
            Dictionary containing visitor metadata schema definition
        """
        return self.get('/api/v1/metadata/schema/visitor')

    # Aggregation API (Advanced - needs additional testing)
    def run_aggregation_query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run aggregation query (NEEDS TESTING)

        Args:
            query: Aggregation query definition

        Returns:
            Dictionary containing aggregation results
        """
        return self.post('/api/v1/aggregation', data=query)

    # Utility Methods
    def test_connection(self) -> bool:
        """Test API connection using working endpoints"""
        try:
            # Test with a known working endpoint
            response = self.list_guides()
            return True
        except PendoAPIError:
            return False

    def get_api_status(self) -> Dict[str, Any]:
        """Get API status and capabilities"""
        status = {
            'connected': self.test_connection(),
            'base_url': self.base_url,
            'api_key_prefix': self.api_key[:10] + '...' if self.api_key else None,
            'working_endpoints': [
                '/api/v1/guide',
                '/api/v1/feature',
                '/api/v1/page',
                '/api/v1/report',
                '/api/v1/metadata/schema/visitor',
                '/api/v1/metadata/schema/guide'
            ],
            'capabilities': [
                'Guide Management',
                'Feature Analytics',
                'Page Analytics',
                'Reporting',
                'Metadata Management'
            ]
        }
        return status

    def get_data_overview(self) -> Dict[str, Any]:
        """
        Get overview of available data
        Returns counts of guides, features, pages, and reports
        """
        try:
            guides = self.list_guides()
            features = self.list_features()
            pages = self.list_pages()
            reports = self.list_reports()

            overview = {
                'timestamp': datetime.now().isoformat(),
                'guides': {
                    'count': len(guides) if isinstance(guides, list) else 0,
                    'sample': guides[0] if isinstance(guides, list) and guides else None
                },
                'features': {
                    'count': len(features) if isinstance(features, list) else 0,
                    'sample': features[0] if isinstance(features, list) and features else None
                },
                'pages': {
                    'count': len(pages) if isinstance(pages, list) else 0,
                    'sample': pages[0] if isinstance(pages, list) and pages else None
                },
                'reports': {
                    'count': len(reports) if isinstance(reports, list) else 0,
                    'sample': reports[0] if isinstance(reports, list) and reports else None
                }
            }

            return overview

        except Exception as e:
            self.logger.error(f"Failed to get data overview: {e}")
            return {'error': str(e)}


class PendoAPIError(Exception):
    """Enhanced Pendo API error with status code"""

    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


# Convenience function for easy client initialization
def create_client() -> PendoAPIClientV2:
    """Create Pendo API client from environment variables"""
    return PendoAPIClientV2()


# Example usage and quick test
if __name__ == "__main__":
    print("🚀 Pendo API Client v2 - Production Ready")
    print("=" * 50)

    try:
        client = create_client()

        # Test connection
        if client.test_connection():
            print("✅ Successfully connected to Pendo API")

            # Get API status
            status = client.get_api_status()
            print(f"📡 Base URL: {status['base_url']}")
            print(f"🔑 API Key: {status['api_key_prefix']}")
            print(f"🎯 Working Endpoints: {len(status['working_endpoints'])}")

            # Get data overview
            overview = client.get_data_overview()
            if 'error' not in overview:
                print(f"\n📊 Data Overview:")
                print(f"   Guides: {overview['guides']['count']}")
                print(f"   Features: {overview['features']['count']}")
                print(f"   Pages: {overview['pages']['count']}")
                print(f"   Reports: {overview['reports']['count']}")

                # Show sample guide data
                if overview['guides']['sample']:
                    sample_guide = overview['guides']['sample']
                    print(f"\n📖 Sample Guide:")
                    print(f"   ID: {sample_guide.get('id', 'N/A')}")
                    print(f"   Name: {sample_guide.get('name', 'N/A')}")
                    print(f"   State: {sample_guide.get('state', 'N/A')}")

            else:
                print(f"❌ Failed to get data overview: {overview['error']}")

        else:
            print("❌ Failed to connect to Pendo API")

    except Exception as e:
        print(f"❌ Error: {e}")