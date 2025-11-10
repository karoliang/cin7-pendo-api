#!/usr/bin/env python3
"""
Pendo Engage API Explorer - Testing case code and alternative authentication methods
"""

import os
import sys
import requests
import json
from datetime import datetime
import urllib.parse

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pendo_client import PendoAPIClient


class PendoEngageAPIExplorer:
    """Explore Pendo Engage API with case code and alternative authentication"""

    def __init__(self):
        self.client = PendoAPIClient()
        self.case_code = "b071f706-e996-4018-8e88-295c586edfe3"
        self.engage_base_url = "https://engageapi.pendo.io"
        self.results = []

    def test_engage_api_authentication(self):
        """Test different authentication methods with Engage API"""
        print("🔐 Testing Pendo Engage API Authentication...")

        # Different auth methods to test
        auth_methods = [
            {
                'name': 'Integration Key Header',
                'headers': {
                    'X-Pendo-Integration-Key': self.client.api_key,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            },
            {
                'name': 'Case Code in Header',
                'headers': {
                    'X-Pendo-Case-Code': self.case_code,
                    'X-Pendo-Integration-Key': self.client.api_key,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            },
            {
                'name': 'Case Code as Bearer Token',
                'headers': {
                    'Authorization': f'Bearer {self.case_code}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            },
            {
                'name': 'Case Code in Query String',
                'params': {'case_code': self.case_code}
            },
            {
                'name': 'Combined Auth (Integration + Case)',
                'headers': {
                    'X-Pendo-Integration-Key': self.client.api_key,
                    'X-Pendo-Case-Code': self.case_code,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        ]

        # Test endpoints with each auth method
        test_endpoints = [
            '/',
            '/api/v1',
            '/api/v1/campaigns',
            '/api/v1/analytics',
            '/api/v1/feedback',
            '/campaigns',
            '/analytics',
            '/engagement',
            '/case' + self.case_code,  # Case-specific endpoint
            f'/api/v1/cases/{self.case_code}'  # Alternative case endpoint
        ]

        for auth_method in auth_methods:
            print(f"\n  Testing {auth_method['name']}...")

            auth_results = []
            for endpoint in test_endpoints:
                result = self.test_endpoint_with_auth(
                    endpoint,
                    auth_method.get('headers', {}),
                    auth_method.get('params', {})
                )
                result['auth_method'] = auth_method['name']
                auth_results.append(result)

                if result['success']:
                    print(f"    ✅ {endpoint} - {result['status_code']}")
                else:
                    print(f"    ❌ {endpoint} - {result['status_code']}")

            # Store successful auth methods
            successful_endpoints = [r for r in auth_results if r['success']]
            if successful_endpoints:
                print(f"    🎯 {auth_method['name']}: {len(successful_endpoints)} working endpoints")

                # Analyze successful responses
                for success in successful_endpoints[:2]:  # Limit output
                    if success.get('sample_data'):
                        print(f"       📋 {success['endpoint']}: {self.analyze_response_structure(success['sample_data'])}")

        return auth_results

    def test_endpoint_with_auth(self, endpoint, headers=None, params=None):
        """Test specific endpoint with custom authentication"""
        url = f"{self.engage_base_url}{endpoint}"

        default_headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Pendo-Integration-Key': self.client.api_key
        }

        if headers:
            default_headers.update(headers)

        try:
            response = requests.get(
                url,
                headers=default_headers,
                params=params,
                timeout=10
            )

            result = {
                'endpoint': endpoint,
                'method': 'GET',
                'status_code': response.status_code,
                'success': response.status_code < 400,
                'content_type': response.headers.get('content-type', ''),
                'content_length': len(response.content),
                'headers': dict(response.headers)
            }

            # Parse JSON response if available
            if response.content and 'application/json' in response.headers.get('content-type', ''):
                try:
                    result['sample_data'] = response.json()
                except:
                    result['parse_error'] = 'Could not parse JSON'
            elif response.content:
                result['text_preview'] = response.text[:200]

            return result

        except requests.exceptions.RequestException as e:
            return {
                'endpoint': endpoint,
                'success': False,
                'error': str(e),
                'auth_method': 'unknown'
            }

    def analyze_response_structure(self, data, max_depth=2, current_depth=0):
        """Analyze JSON response structure for insights"""
        if current_depth >= max_depth:
            return "..."

        indent = "  " * current_depth

        if isinstance(data, dict):
            keys = list(data.keys())[:5]  # Limit to 5 keys
            analysis = []
            for key in keys:
                value = data[key]
                if isinstance(value, dict):
                    analysis.append(f"{key}: {{object}}")
                elif isinstance(value, list):
                    analysis.append(f"{key}: [{len(value)} items]")
                else:
                    preview = str(value)[:30]
                    analysis.append(f"{key}: {preview}")
            return f"{indent}{{" + ", ".join(analysis) + "}}"
        elif isinstance(data, list):
            if len(data) > 0:
                return f"{indent}[{len(data)} items] - {self.analyze_response_structure(data[0], max_depth, current_depth + 1)}"
            return f"{indent}[]"
        else:
            return f"{indent}{str(data)[:50]}"

    def test_case_code_specific_endpoints(self):
        """Test case code specific API endpoints"""
        print("\n🔍 Testing Case Code Specific Endpoints...")

        # Case-specific endpoint patterns
        case_endpoints = [
            f'/case/{self.case_code}',
            f'/api/v1/cases/{self.case_code}',
            f'/api/v1/case/{self.case_code}',
            f'/engagement/{self.case_code}',
            f'/analytics/case/{self.case_code}',
            f'/reports/{self.case_code}',
            f'/campaigns/case/{self.case_code}',
            f'/feedback/case/{self.case_code}'
        ]

        results = []

        for endpoint in case_endpoints:
            print(f"  Testing {endpoint}...")
            result = self.test_endpoint_with_auth(
                endpoint,
                headers={
                    'X-Pendo-Case-Code': self.case_code,
                    'X-Pendo-Integration-Key': self.client.api_key
                }
            )

            if result['success']:
                print(f"    ✅ {result['status_code']} - {result.get('content_length', 0)} bytes")

                # Analyze the response
                if result.get('sample_data'):
                    structure = self.analyze_response_structure(result['sample_data'])
                    print(f"       📋 Structure: {structure}")
            else:
                print(f"    ❌ {result['status_code']}")

            results.append(result)

        return results

    def test_alternative_base_urls(self):
        """Test alternative Pendo API base URLs"""
        print("\n🌐 Testing Alternative Base URLs...")

        alternative_urls = [
            "https://api.pendo.io",
            "https://engageapi.pendo.io",
            "https://developers.pendo.io",
            "https://data.pendo.io",
            "https://app.pendo.io/api",
            "https://app.pendo.io",
            "https://pendo.io/api"
        ]

        test_endpoint = "/api/v1/status"  # Common endpoint to test

        results = []

        for base_url in alternative_urls:
            print(f"  Testing {base_url}...")

            try:
                url = f"{base_url}{test_endpoint}"
                headers = {
                    'X-Pendo-Integration-Key': self.client.api_key,
                    'X-Pendo-Case-Code': self.case_code,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }

                response = requests.get(url, headers=headers, timeout=10)

                success = response.status_code < 400
                result = {
                    'base_url': base_url,
                    'endpoint': test_endpoint,
                    'status_code': response.status_code,
                    'success': success,
                    'content_type': response.headers.get('content-type', ''),
                    'content_length': len(response.content)
                }

                if success:
                    print(f"    ✅ {response.status_code} - Working!")
                    try:
                        result['sample_data'] = response.json()
                        print(f"       📋 Response: {self.analyze_response_structure(result['sample_data'])}")
                    except:
                        pass
                else:
                    print(f"    ❌ {response.status_code}")

                results.append(result)

            except Exception as e:
                print(f"    ❌ Error: {str(e)[:50]}")
                results.append({
                    'base_url': base_url,
                    'success': False,
                    'error': str(e)
                })

        return results

    def test_webhook_and_integration_endpoints(self):
        """Test webhook and integration specific endpoints"""
        print("\n🔗 Testing Webhook & Integration Endpoints...")

        webhook_endpoints = [
            '/webhooks',
            '/api/v1/webhooks',
            '/integrations',
            '/api/v1/integrations',
            '/api/v1/subscriptions',
            '/api/v1/feeds',
            '/api/v1/streams',
            f'/case/{self.case_code}/webhooks',
            f'/api/v1/cases/{self.case_code}/integrations'
        ]

        results = []

        for endpoint in webhook_endpoints:
            print(f"  Testing {endpoint}...")
            result = self.test_endpoint_with_auth(
                endpoint,
                headers={
                    'X-Pendo-Case-Code': self.case_code,
                    'X-Pendo-Integration-Key': self.client.api_key
                }
            )

            if result['success']:
                print(f"    ✅ {result['status_code']}")
            else:
                print(f"    ❌ {result['status_code']}")

            results.append(result)

        return results

    def generate_comprehensive_report(self, all_results):
        """Generate comprehensive exploration report"""
        timestamp = datetime.now().isoformat()

        # Flatten all results
        flattened_results = []
        for result_group in all_results:
            if isinstance(result_group, list):
                flattened_results.extend(result_group)

        successful_results = [r for r in flattened_results if r.get('success', False)]

        report = {
            "exploration_timestamp": timestamp,
            "case_code": self.case_code,
            "integration_key": self.client.api_key[:10] + "...",
            "base_urls_tested": ["https://api.pendo.io", "https://engageapi.pendo.io"],
            "total_tests": len(flattened_results),
            "successful_tests": len(successful_results),
            "success_rate": len(successful_results) / len(flattened_results) * 100 if flattened_results else 0,
            "working_endpoints": [r.get('endpoint') for r in successful_results if 'endpoint' in r],
            "working_auth_methods": list(set([r.get('auth_method') for r in successful_results if r.get('auth_method')])),
            "detailed_results": flattened_results
        }

        # Save report
        report_path = os.path.join(os.path.dirname(__file__), 'engage_api_exploration_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n📄 Comprehensive report saved to: {report_path}")
        return report

    def run_complete_exploration(self):
        """Run complete Engage API exploration"""
        print("🚀 Pendo Engage API Explorer with Case Code")
        print("=" * 60)
        print(f"🔑 Integration Key: {self.client.api_key[:10]}...")
        print(f"🎫 Case Code: {self.case_code}")

        all_results = []

        # Test authentication methods
        auth_results = self.test_engage_api_authentication()
        all_results.append(auth_results)

        # Test case code specific endpoints
        case_results = self.test_case_code_specific_endpoints()
        all_results.append(case_results)

        # Test alternative base URLs
        url_results = self.test_alternative_base_urls()
        all_results.append(url_results)

        # Test webhook endpoints
        webhook_results = self.test_webhook_and_integration_endpoints()
        all_results.append(webhook_results)

        # Generate report
        report = self.generate_comprehensive_report(all_results)

        # Print summary
        print(f"\n📊 Exploration Summary:")
        print(f"   Total tests: {report['total_tests']}")
        print(f"   Successful: {report['successful_tests']}")
        print(f"   Success rate: {report['success_rate']:.1f}%")

        if report['working_endpoints']:
            print(f"\n✅ Working Endpoints:")
            for endpoint in report['working_endpoints'][:10]:  # Limit output
                print(f"   • {endpoint}")

        if report['working_auth_methods']:
            print(f"\n🔐 Working Authentication Methods:")
            for method in report['working_auth_methods']:
                print(f"   • {method}")

        return report


def main():
    """Run Engage API exploration"""
    explorer = PendoEngageAPIExplorer()
    report = explorer.run_complete_exploration()
    return report


if __name__ == "__main__":
    main()