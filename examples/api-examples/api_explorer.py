#!/usr/bin/env python3
"""
Pendo API Explorer - Discover actual API endpoints and capabilities
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pendo_client import PendoAPIClient, PendoAPIError


class PendoAPIExplorer:
    """Explore Pendo API endpoints and discover capabilities"""

    def __init__(self):
        self.client = PendoAPIClient()
        self.discovered_endpoints = []

    def test_endpoint(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Test a specific endpoint and return results"""
        url = f"{self.client.base_url}{endpoint}"
        headers = {
            'X-Pendo-Integration-Key': self.client.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        try:
            print(f"  Testing {method} {endpoint}...")
            response = requests.request(method, url, headers=headers, json=data, timeout=10)

            result = {
                'endpoint': endpoint,
                'method': method,
                'status_code': response.status_code,
                'success': response.status_code < 400,
                'content_type': response.headers.get('content-type', ''),
                'content_length': len(response.content),
                'sample_data': None
            }

            # Try to parse JSON response
            if response.content and 'application/json' in response.headers.get('content-type', ''):
                try:
                    json_data = response.json()
                    result['sample_data'] = json_data
                    if isinstance(json_data, dict) and 'data' in json_data:
                        result['has_data'] = len(json_data['data']) > 0 if isinstance(json_data['data'], list) else True
                except:
                    result['parse_error'] = 'Could not parse JSON'

            # Store successful endpoints
            if result['success']:
                self.discovered_endpoints.append(endpoint)
                print(f"    ✅ {response.status_code} - {len(response.content)} bytes")
            else:
                print(f"    ❌ {response.status_code} - {response.reason[:50]}")

            return result

        except requests.exceptions.RequestException as e:
            print(f"    ❌ Request failed: {str(e)[:50]}")
            return {
                'endpoint': endpoint,
                'method': method,
                'success': False,
                'error': str(e)
            }

    def explore_common_endpoints(self):
        """Test common API endpoint patterns"""
        print("🔍 Exploring common API endpoint patterns...")

        # Common endpoint patterns to test
        endpoints_to_test = [
            # API version patterns
            '/api/v1/',
            '/api/v2/',
            '/v1/',
            '/v2/',

            # Resource endpoints
            '/api/v1/users',
            '/api/v1/accounts',
            '/api/v1/campaigns',
            '/api/v1/analytics',
            '/api/v1/feedback',
            '/api/v1/guides',
            '/api/v1/events',
            '/api/v1/features',
            '/api/v1/reports',
            '/api/v1/metadata',

            # Pendo-specific endpoints
            '/api/v1/visitors',
            '/api/v1/aggregates',
            '/api/v1/monitors',
            '/api/v1/segments',
            '/api/v1/applications',
            '/api/v1/featureFlags',

            # Alternative patterns
            '/users',
            '/accounts',
            '/campaigns',
            '/analytics',
            '/feedback',
            '/guides',
            '/events',

            # Root and info endpoints
            '/',
            '/api',
            '/api/v1/info',
            '/api/v1/status',
            '/health',
            '/status',
            '/ping',

            # Integration-specific
            '/integrations',
            '/api/v1/integrations',
            '/api/v1/webhooks',
        ]

        results = []

        for endpoint in endpoints_to_test:
            # Test GET request
            result = self.test_endpoint('GET', endpoint)
            results.append(result)

        return results

    def test_post_endpoints(self):
        """Test POST endpoints with sample data"""
        print("\n📝 Testing POST endpoints...")

        post_endpoints = [
            '/api/v1/events',
            '/api/v1/feedback',
            '/api/v1/users',
            '/api/v1/accounts',
            '/api/v1/campaigns',
        ]

        # Sample data for different endpoints
        sample_data = {
            '/api/v1/events': {
                'type': 'test_event',
                'visitorId': 'test_visitor',
                'timestamp': datetime.now().isoformat()
            },
            '/api/v1/feedback': {
                'visitorId': 'test_visitor',
                'values': {'rating': 5, 'comment': 'Test feedback'}
            },
            '/api/v1/users': {
                'id': 'test_user',
                'email': 'test@example.com',
                'firstName': 'Test',
                'lastName': 'User'
            }
        }

        results = []

        for endpoint in post_endpoints:
            data = sample_data.get(endpoint, {})
            result = self.test_endpoint('POST', endpoint, data=data)
            results.append(result)

        return results

    def test_authentication_methods(self):
        """Test different authentication methods"""
        print("\n🔐 Testing authentication methods...")

        auth_methods = [
            {'name': 'X-Pendo-Integration-Key', 'header': 'X-Pendo-Integration-Key'},
            {'name': 'Authorization Bearer', 'header': 'Authorization', 'value': f'Bearer {self.client.api_key}'},
            {'name': 'Pendo-Integration-Key', 'header': 'Pendo-Integration-Key'},
            {'name': 'api-key header', 'header': 'api-key'},
        ]

        test_endpoint = '/api/v1/users'  # Use this as test endpoint
        results = []

        for auth_method in auth_methods:
            print(f"  Testing {auth_method['name']}...")
            url = f"{self.client.base_url}{test_endpoint}"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }

            if auth_method['name'] == 'Authorization Bearer':
                headers[auth_method['header']] = auth_method['value']
            else:
                headers[auth_method['header']] = self.client.api_key

            try:
                response = requests.get(url, headers=headers, timeout=10)
                success = response.status_code < 400

                if success:
                    print(f"    ✅ {auth_method['name']} works! Status: {response.status_code}")
                else:
                    print(f"    ❌ {auth_method['name']} failed. Status: {response.status_code}")

                results.append({
                    'method': auth_method['name'],
                    'success': success,
                    'status_code': response.status_code
                })

            except Exception as e:
                print(f"    ❌ {auth_method['name']} error: {str(e)[:50]}")
                results.append({
                    'method': auth_method['name'],
                    'success': False,
                    'error': str(e)
                })

        return results

    def explore_api_structure(self):
        """Try to discover API structure from successful responses"""
        print("\n🏗️  Analyzing API structure...")

        if not self.discovered_endpoints:
            print("  No working endpoints found yet")
            return

        # Try to get detailed information from working endpoints
        for endpoint in self.discovered_endpoints[:3]:  # Limit to first 3
            try:
                response = requests.get(
                    f"{self.client.base_url}{endpoint}",
                    headers={
                        'X-Pendo-Integration-Key': self.client.api_key,
                        'Accept': 'application/json'
                    },
                    params={'limit': 1},
                    timeout=10
                )

                if response.status_code == 200 and response.content:
                    try:
                        data = response.json()
                        print(f"\n  📋 Endpoint: {endpoint}")
                        self._analyze_response_structure(data)
                    except:
                        print(f"    Could not parse JSON from {endpoint}")

            except Exception as e:
                print(f"    Error analyzing {endpoint}: {str(e)[:50]}")

    def _analyze_response_structure(self, data, indent=0):
        """Analyze and display JSON response structure"""
        prefix = "    " * indent

        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, dict):
                    print(f"{prefix}{key}: {{object}}")
                    if indent < 2:  # Limit depth
                        self._analyze_response_structure(value, indent + 1)
                elif isinstance(value, list):
                    print(f"{prefix}{key}: [{len(value)} items]")
                    if len(value) > 0 and indent < 2:
                        self._analyze_response_structure(value[0], indent + 1)
                else:
                    value_preview = str(value)[:50]
                    print(f"{prefix}{key}: {value_preview}")
        elif isinstance(data, list):
            print(f"{prefix}[{len(data)} items]")
            if len(data) > 0 and isinstance(data[0], dict):
                self._analyze_response_structure(data[0], indent)

    def generate_report(self, all_results):
        """Generate exploration report"""
        timestamp = datetime.now().isoformat()

        report = {
            "exploration_timestamp": timestamp,
            "api_key": self.client.api_key[:10] + "...",
            "base_url": self.client.base_url,
            "discovered_endpoints": self.discovered_endpoints,
            "total_endpoints_tested": len(all_results),
            "successful_endpoints": len(self.discovered_endpoints),
            "success_rate": len(self.discovered_endpoints) / len(all_results) * 100 if all_results else 0,
            "detailed_results": all_results
        }

        # Save report
        report_path = os.path.join(os.path.dirname(__file__), 'api_exploration_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n📄 Exploration report saved to: {report_path}")
        return report

    def run_full_exploration(self):
        """Run complete API exploration"""
        print("🚀 Pendo.io API Explorer")
        print("=" * 50)

        all_results = []

        # Test common endpoints
        endpoint_results = self.explore_common_endpoints()
        all_results.extend(endpoint_results)

        # Test POST endpoints
        post_results = self.test_post_endpoints()
        all_results.extend(post_results)

        # Test authentication methods
        auth_results = self.test_authentication_methods()

        # Explore API structure
        self.explore_api_structure()

        # Generate report
        report = self.generate_report(all_results)

        print(f"\n📊 Exploration Summary:")
        print(f"   Total endpoints tested: {report['total_endpoints_tested']}")
        print(f"   Successful endpoints: {report['successful_endpoints']}")
        print(f"   Success rate: {report['success_rate']:.1f}%")

        if self.discovered_endpoints:
            print(f"\n✅ Discovered working endpoints:")
            for endpoint in self.discovered_endpoints:
                print(f"   • {endpoint}")
        else:
            print(f"\n❌ No working endpoints discovered")

        return report


def main():
    """Run API exploration"""
    explorer = PendoAPIExplorer()
    report = explorer.run_full_exploration()
    return report


if __name__ == "__main__":
    main()