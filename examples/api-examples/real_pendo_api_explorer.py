#!/usr/bin/env python3
"""
Real Pendo API Explorer - Based on discovered documentation
Testing the actual Pendo API endpoints using correct base URLs
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pendo_client import PendoAPIClient


class RealPendoAPIExplorer:
    """Explore the real Pendo API using correct base URLs and endpoints"""

    def __init__(self):
        self.client = PendoAPIClient()
        self.api_key = self.client.api_key
        self.case_code = "b071f706-e996-4018-8e88-295c586edfe3"

        # Real Pendo API base URLs from documentation
        self.base_urls = [
            "https://app.pendo.io",
            "https://app.eu.pendo.io",
            "https://us1.app.pendo.io",
            "https://app.jpn.pendo.io",
            "https://app.au.pendo.io"
        ]

        self.results = []

    def test_real_pendo_endpoints(self):
        """Test real Pendo API endpoints based on documentation"""
        print("🎯 Testing Real Pendo API Endpoints...")

        # Real API endpoints from Pendo documentation
        api_endpoints = [
            # Aggregation API
            '/api/v1/aggregation',
            '/api/v1/aggregate',

            # User/Visitor Management
            '/api/v1/visitor',
            '/api/v1/visitors',
            '/api/v1/visitor/{visitorId}',
            '/api/v1/visitors/bulk',

            # Account Management
            '/api/v1/account',
            '/api/v1/accounts',
            '/api/v1/account/{accountId}',
            '/api/v1/accounts/bulk',

            # Guide Management
            '/api/v1/guide',
            '/api/v1/guides',
            '/api/v1/guide/{guideId}',
            '/api/v1/guides/bulk',

            # Feature Management
            '/api/v1/feature',
            '/api/v1/features',
            '/api/v1/feature/{featureId}',

            # Page Management
            '/api/v1/page',
            '/api/v1/pages',
            '/api/v1/page/{pageId}',

            # Track Events
            '/api/v1/track',
            '/api/v1/events',

            # Reports
            '/api/v1/report',
            '/api/v1/reports',
            '/api/v1/report/{reportId}',

            # Metadata
            '/api/v1/metadata/schema',
            '/api/v1/metadata/fields',

            # Usage
            '/api/v1/usage',
            '/api/v1/subscription',

            # Status/Health
            '/api/v1/status',
            '/api/v1/health'
        ]

        for base_url in self.base_urls:
            print(f"\n🌐 Testing Base URL: {base_url}")
            base_url_results = []

            for endpoint in api_endpoints:
                result = self.test_pendo_endpoint(base_url, endpoint)
                result['base_url'] = base_url
                base_url_results.append(result)

                if result['success']:
                    print(f"    ✅ {endpoint} - {result['status_code']}")
                    if result.get('sample_data'):
                        print(f"       📋 {self.analyze_response_structure(result['sample_data'])}")
                else:
                    print(f"    ❌ {endpoint} - {result['status_code']}")

            # Check if we found working endpoints for this base URL
            working_endpoints = [r for r in base_url_results if r['success']]
            if working_endpoints:
                print(f"    🎯 Found {len(working_endpoints)} working endpoints for {base_url}")

                # Save first successful base URL for detailed testing
                if not hasattr(self, 'working_base_url'):
                    self.working_base_url = base_url
                    self.working_endpoints = working_endpoints

            self.results.extend(base_url_results)

        return self.results

    def test_pendo_endpoint(self, base_url, endpoint, method='GET', data=None):
        """Test a specific Pendo API endpoint"""
        url = f"{base_url}{endpoint}"

        headers = {
            'X-Pendo-Integration-Key': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Pendo-API-Explorer/1.0'
        }

        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                json=data,
                timeout=15
            )

            result = {
                'base_url': base_url,
                'endpoint': endpoint,
                'method': method,
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
                except json.JSONDecodeError:
                    result['text_preview'] = response.text[:200]
            elif response.content:
                result['text_preview'] = response.text[:200]

            return result

        except requests.exceptions.RequestException as e:
            return {
                'base_url': base_url,
                'endpoint': endpoint,
                'method': method,
                'success': False,
                'error': str(e)
            }

    def test_aggregation_api(self):
        """Test Pendo's powerful aggregation API"""
        print("\n📊 Testing Pendo Aggregation API...")

        if not hasattr(self, 'working_base_url'):
            print("   ❌ No working base URL found")
            return []

        aggregation_queries = [
            # Simple visitor count
            {
                "name": "Visitor Count",
                "request": {
                    "response": {
                        "mimeType": "application/json"
                    },
                    "pipeline": [
                        {
                            "source": {
                                "visitors": {}
                            }
                        },
                        {
                            "count": "*"
                        }
                    ]
                }
            },

            # Account count
            {
                "name": "Account Count",
                "request": {
                    "response": {
                        "mimeType": "application/json"
                    },
                    "pipeline": [
                        {
                            "source": {
                                "accounts": {}
                            }
                        },
                        {
                            "count": "*"
                        }
                    ]
                }
            },

            # Guide activity
            {
                "name": "Guide Activity",
                "request": {
                    "response": {
                        "mimeType": "application/json"
                    },
                    "pipeline": [
                        {
                            "source": {
                                "guideEvents": {}
                            }
                        },
                        {
                            "count": "*"
                        }
                    ]
                }
            }
        ]

        results = []

        for query in aggregation_queries:
            print(f"  Testing {query['name']}...")
            result = self.test_pendo_endpoint(
                self.working_base_url,
                '/api/v1/aggregation',
                method='POST',
                data=query['request']
            )

            result['query_name'] = query['name']
            results.append(result)

            if result['success']:
                print(f"    ✅ {result['status_code']} - {result.get('content_length', 0)} bytes")
                if result.get('sample_data'):
                    print(f"       📋 Response: {self.analyze_response_structure(result['sample_data'])}")
            else:
                print(f"    ❌ {result['status_code']}")

        return results

    def test_visitor_metadata_operations(self):
        """Test visitor metadata CRUD operations"""
        print("\n👥 Testing Visitor Metadata Operations...")

        if not hasattr(self, 'working_base_url'):
            print("   ❌ No working base URL found")
            return []

        operations = [
            {
                "name": "List Visitors",
                "method": "GET",
                "endpoint": "/api/v1/visitor",
                "data": None
            },
            {
                "name": "Get Visitor Metadata Schema",
                "method": "GET",
                "endpoint": "/api/v1/metadata/schema/visitor",
                "data": None
            },
            {
                "name": "Create/Update Visitor",
                "method": "POST",
                "endpoint": "/api/v1/visitor",
                "data": {
                    "visitorId": "test_visitor_" + datetime.now().strftime("%Y%m%d_%H%M%S"),
                    "values": {
                        "email": "test@example.com",
                        "firstName": "Test",
                        "lastName": "User",
                        "testField": "API Test"
                    }
                }
            }
        ]

        results = []

        for operation in operations:
            print(f"  Testing {operation['name']}...")
            result = self.test_pendo_endpoint(
                self.working_base_url,
                operation['endpoint'],
                method=operation['method'],
                data=operation['data']
            )

            result['operation_name'] = operation['name']
            results.append(result)

            if result['success']:
                print(f"    ✅ {result['status_code']}")
                if result.get('sample_data'):
                    print(f"       📋 Response: {self.analyze_response_structure(result['sample_data'])}")
            else:
                print(f"    ❌ {result['status_code']}")

        return results

    def test_guide_operations(self):
        """Test guide management operations"""
        print("\n📖 Testing Guide Operations...")

        if not hasattr(self, 'working_base_url'):
            print("   ❌ No working base URL found")
            return []

        operations = [
            {
                "name": "List Guides",
                "method": "GET",
                "endpoint": "/api/v1/guide",
                "data": None
            },
            {
                "name": "Get Guide Schema",
                "method": "GET",
                "endpoint": "/api/v1/metadata/schema/guide",
                "data": None
            }
        ]

        results = []

        for operation in operations:
            print(f"  Testing {operation['name']}...")
            result = self.test_pendo_endpoint(
                self.working_base_url,
                operation['endpoint'],
                method=operation['method'],
                data=operation['data']
            )

            result['operation_name'] = operation['name']
            results.append(result)

            if result['success']:
                print(f"    ✅ {result['status_code']}")
                if result.get('sample_data'):
                    print(f"       📋 Response: {self.analyze_response_structure(result['sample_data'])}")
            else:
                print(f"    ❌ {result['status_code']}")

        return results

    def analyze_response_structure(self, data, max_depth=2, current_depth=0):
        """Analyze JSON response structure for insights"""
        if current_depth >= max_depth:
            return "..."

        indent = "  " * current_depth

        if isinstance(data, dict):
            keys = list(data.keys())[:5]
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
                return f"{indent}[{len(data)} items]"
            return f"{indent}[]"
        else:
            return f"{indent}{str(data)[:50]}"

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
            "integration_key": self.api_key[:10] + "...",
            "case_code": self.case_code,
            "base_urls_tested": self.base_urls,
            "working_base_url": getattr(self, 'working_base_url', None),
            "total_tests": len(flattened_results),
            "successful_tests": len(successful_results),
            "success_rate": len(successful_results) / len(flattened_results) * 100 if flattened_results else 0,
            "working_endpoints": [r.get('endpoint') for r in successful_results if 'endpoint' in r],
            "discovered_capabilities": self._discover_capabilities(successful_results),
            "detailed_results": flattened_results
        }

        # Save report
        report_path = os.path.join(os.path.dirname(__file__), 'real_pendo_api_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n📄 Comprehensive report saved to: {report_path}")
        return report

    def _discover_capabilities(self, successful_results):
        """Discover API capabilities from successful results"""
        capabilities = set()

        for result in successful_results:
            endpoint = result.get('endpoint', '')

            if 'aggregation' in endpoint:
                capabilities.add('Analytics & Aggregation')
            elif 'visitor' in endpoint:
                capabilities.add('Visitor Management')
            elif 'account' in endpoint:
                capabilities.add('Account Management')
            elif 'guide' in endpoint:
                capabilities.add('Guide Management')
            elif 'feature' in endpoint:
                capabilities.add('Feature Analytics')
            elif 'page' in endpoint:
                capabilities.add('Page Analytics')
            elif 'track' in endpoint or 'event' in endpoint:
                capabilities.add('Event Tracking')
            elif 'report' in endpoint:
                capabilities.add('Reporting')
            elif 'metadata' in endpoint:
                capabilities.add('Metadata Management')
            elif 'status' in endpoint or 'health' in endpoint:
                capabilities.add('System Status')

        return list(capabilities)

    def run_complete_exploration(self):
        """Run complete real Pendo API exploration"""
        print("🚀 Real Pendo API Explorer")
        print("=" * 60)
        print(f"🔑 Integration Key: {self.api_key[:10]}...")
        print(f"🎫 Case Code: {self.case_code}")

        all_results = []

        # Test all base URLs and endpoints
        endpoint_results = self.test_real_pendo_endpoints()
        all_results.append(endpoint_results)

        # If we found working endpoints, test specific APIs
        if hasattr(self, 'working_base_url'):
            print(f"\n🎯 Working Base URL Found: {self.working_base_url}")

            # Test aggregation API
            aggregation_results = self.test_aggregation_api()
            all_results.append(aggregation_results)

            # Test visitor operations
            visitor_results = self.test_visitor_metadata_operations()
            all_results.append(visitor_results)

            # Test guide operations
            guide_results = self.test_guide_operations()
            all_results.append(guide_results)

        else:
            print("\n❌ No working base URL found with current integration key")

        # Generate report
        report = self.generate_comprehensive_report(all_results)

        # Print summary
        print(f"\n📊 Exploration Summary:")
        print(f"   Total tests: {report['total_tests']}")
        print(f"   Successful: {report['successful_tests']}")
        print(f"   Success rate: {report['success_rate']:.1f}%")

        if report.get('working_base_url'):
            print(f"   Working base URL: {report['working_base_url']}")

        if report['working_endpoints']:
            print(f"\n✅ Working Endpoints:")
            for endpoint in report['working_endpoints'][:10]:
                print(f"   • {endpoint}")

        if report['discovered_capabilities']:
            print(f"\n🎯 Discovered Capabilities:")
            for capability in report['discovered_capabilities']:
                print(f"   • {capability}")

        return report


def main():
    """Run real Pendo API exploration"""
    explorer = RealPendoAPIExplorer()
    report = explorer.run_complete_exploration()
    return report


if __name__ == "__main__":
    main()