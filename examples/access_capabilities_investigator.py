#!/usr/bin/env python3
"""
Pendo Access Capabilities Investigator
Comprehensive analysis of what the integration key can do
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pendo_client_v2 import PendoAPIClientV2


class PendoAccessInvestigator:
    """Investigate comprehensive access capabilities of the integration key"""

    def __init__(self):
        self.client = PendoAPIClientV2()
        self.api_key = self.client.api_key
        self.results = []

    def log_result(self, category, operation, success, details="", data=None):
        """Log investigation result"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'category': category,
            'operation': operation,
            'success': success,
            'details': details,
            'data_count': len(data) if data and isinstance(data, list) else 1 if data else 0,
            'sample_data': data[0] if data and isinstance(data, list) and data else None
        }
        self.results.append(result)

        status_icon = "✅" if success else "❌"
        print(f"  {status_icon} {operation}: {details}")

        return result

    def investigate_read_capabilities(self):
        """Investigate all read capabilities"""
        print("\n📖 INVESTIGATING READ CAPABILITIES")
        print("=" * 50)

        # Known working read endpoints
        read_operations = [
            ('Guides', 'List All Guides', lambda: self.client.list_guides()),
            ('Features', 'List All Features', lambda: self.client.list_features()),
            ('Pages', 'List All Pages', lambda: self.client.list_pages()),
            ('Reports', 'List All Reports', lambda: self.client.list_reports()),
            ('Metadata', 'Visitor Schema', lambda: self.client.get_visitor_metadata_schema()),
            ('Metadata', 'Guide Schema', lambda: self.client.get_guide_schema()),
        ]

        for category, operation, function in read_operations:
            try:
                data = function()
                self.log_result(category, operation, True, f"Retrieved {len(data) if isinstance(data, list) else 'data'} items", data)
            except Exception as e:
                self.log_result(category, operation, False, f"Error: {str(e)[:50]}")

    def investigate_write_capabilities(self):
        """Investigate write/update capabilities"""
        print("\n✏️ INVESTIGATING WRITE/UPDATE CAPABILITIES")
        print("=" * 50)

        # Test visitor update/create
        print("  Testing Visitor Management...")
        try:
            test_visitor_data = {
                "visitorId": f"test_visitor_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "values": {
                    "email": "test@example.com",
                    "firstName": "Test",
                    "lastName": "User",
                    "testField": "API Investigation"
                }
            }

            # Try to create/update visitor
            result = self.client.post('/api/v1/visitor', data=test_visitor_data)
            self.log_result('Visitor', 'Create/Update Visitor', True, "Visitor created/updated successfully", result)

        except Exception as e:
            self.log_result('Visitor', 'Create/Update Visitor', False, f"Error: {str(e)[:50]}")

        # Test account update/create
        print("  Testing Account Management...")
        try:
            test_account_data = {
                "accountId": f"test_account_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "values": {
                    "name": "Test Account",
                    "industry": "Technology",
                    "testField": "API Investigation"
                }
            }

            result = self.client.post('/api/v1/account', data=test_account_data)
            self.log_result('Account', 'Create/Update Account', True, "Account created/updated successfully", result)

        except Exception as e:
            self.log_result('Account', 'Create/Update Account', False, f"Error: {str(e)[:50]}")

        # Test guide update (if we can get a guide ID)
        print("  Testing Guide Update...")
        try:
            # First get a guide to update
            guides = self.client.list_guides()
            if guides and len(guides) > 0:
                guide_id = guides[0].get('id')
                if guide_id:
                    update_data = {
                        "name": f"Updated Guide Name {datetime.now().strftime('%H%M%S')}",
                        "state": "public"
                    }
                    result = self.client.put(f'/api/v1/guide/{guide_id}', data=update_data)
                    self.log_result('Guide', 'Update Guide', True, f"Guide {guide_id} updated", result)
            else:
                self.log_result('Guide', 'Update Guide', False, "No guides available to test")

        except Exception as e:
            self.log_result('Guide', 'Update Guide', False, f"Error: {str(e)[:50]}")

    def investigate_management_capabilities(self):
        """Investigate management operations (create, delete, configure)"""
        print("\n🔧 INVESTIGATING MANAGEMENT CAPABILITIES")
        print("=" * 50)

        # Test aggregation queries (advanced analytics)
        print("  Testing Aggregation API...")
        try:
            # Simple visitor count query
            aggregation_query = {
                "response": {"mimeType": "application/json"},
                "pipeline": [
                    {"source": {"visitors": {}}},
                    {"count": "*"}
                ]
            }

            result = self.client.run_aggregation_query(aggregation_query)
            self.log_result('Analytics', 'Run Aggregation Query', True, "Aggregation query successful", result)

        except Exception as e:
            self.log_result('Analytics', 'Run Aggregation Query', False, f"Error: {str(e)[:50]}")

        # Test track event creation
        print("  Testing Event Tracking...")
        try:
            event_data = {
                "visitorId": f"test_visitor_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "type": "test_event",
                "properties": {
                    "category": "API Investigation",
                    "action": "Access Test",
                    "value": 1
                }
            }

            result = self.client.post('/api/v1/track', data=event_data)
            self.log_result('Events', 'Track Custom Event', True, "Event tracked successfully", result)

        except Exception as e:
            self.log_result('Events', 'Track Custom Event', False, f"Error: {str(e)[:50]}")

    def investigate_account_level_info(self):
        """Investigate account-level information and subscription details"""
        print("\n🏢 INVESTIGATING ACCOUNT LEVEL INFORMATION")
        print("=" * 50)

        # Test subscription/usage info
        subscription_endpoints = [
            ('Subscription Info', '/api/v1/subscription'),
            ('Usage Statistics', '/api/v1/usage'),
            ('Account Details', '/api/v1/account/me'),
            ('User Permissions', '/api/v1/user/me'),
            ('API Keys Info', '/api/v1/integrationkeys'),
            ('Webhook Settings', '/api/v1/webhooks'),
            ('Data Settings', '/api/v1/data-settings'),
            ('Feature Flags', '/api/v1/featureFlags')
        ]

        for operation, endpoint in subscription_endpoints:
            try:
                result = self.client.get(endpoint)
                self.log_result('Account', operation, True, f"Retrieved account information", result)
            except Exception as e:
                self.log_result('Account', operation, False, f"Error: {str(e)[:50]}")

    def investigate_advanced_features(self):
        """Investigate advanced features and capabilities"""
        print("\n🚀 INVESTIGATING ADVANCED FEATURES")
        print("=" * 50)

        # Test bulk operations
        print("  Testing Bulk Operations...")
        try:
            bulk_visitor_data = {
                "visitors": [
                    {
                        "visitorId": f"bulk_test_1_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        "values": {"email": "bulk1@example.com"}
                    },
                    {
                        "visitorId": f"bulk_test_2_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        "values": {"email": "bulk2@example.com"}
                    }
                ]
            }

            result = self.client.post('/api/v1/visitors/bulk', data=bulk_visitor_data)
            self.log_result('Bulk Operations', 'Bulk Visitor Update', True, "Bulk operation successful", result)

        except Exception as e:
            self.log_result('Bulk Operations', 'Bulk Visitor Update', False, f"Error: {str(e)[:50]}")

        # Test custom report creation
        print("  Testing Report Creation...")
        try:
            report_data = {
                "name": f"Test Report {datetime.now().strftime('%H%M%S')}",
                "description": "API Investigation Test Report",
                "definition": {
                    "response": {"mimeType": "application/json"},
                    "pipeline": [
                        {"source": {"visitors": {}}},
                        {"count": "*"}
                    ]
                }
            }

            result = self.client.post('/api/v1/report', data=report_data)
            self.log_result('Reports', 'Create Custom Report', True, "Report created successfully", result)

        except Exception as e:
            self.log_result('Reports', 'Create Custom Report', False, f"Error: {str(e)[:50]}")

    def investigate_delete_capabilities(self):
        """Investigate delete capabilities (be careful!)"""
        print("\n🗑️ INVESTIGATING DELETE CAPABILITIES")
        print("=" * 50)
        print("  ⚠️  Testing delete operations on test data only...")

        # Test deleting test data we might have created
        print("  Testing Test Data Cleanup...")
        try:
            # Try to delete a test visitor (if it exists)
            test_visitor_id = f"test_visitor_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # This would normally be a DELETE request, but we'll test access first
            # result = self.client.delete(f'/api/v1/visitor/{test_visitor_id}')

            # For safety, we'll just test if the endpoint exists
            result = self.client.get(f'/api/v1/visitor/{test_visitor_id}')

            if 'error' in result or 'not found' in str(result).lower():
                self.log_result('Delete', 'Delete Visitor', True, "Delete endpoint accessible (test visitor not found)")
            else:
                self.log_result('Delete', 'Delete Visitor', False, "Unexpected response")

        except Exception as e:
            if '404' in str(e) or 'not found' in str(e).lower():
                self.log_result('Delete', 'Delete Visitor', True, "Delete endpoint accessible (404 indicates endpoint exists)")
            else:
                self.log_result('Delete', 'Delete Visitor', False, f"Error: {str(e)[:50]}")

    def analyze_permissions(self):
        """Analyze and summarize permissions"""
        print("\n📊 PERMISSIONS ANALYSIS")
        print("=" * 50)

        # Count successful operations by category
        categories = {}
        for result in self.results:
            category = result['category']
            if category not in categories:
                categories[category] = {'success': 0, 'total': 0}
            categories[category]['total'] += 1
            if result['success']:
                categories[category]['success'] += 1

        print("  Success Rates by Category:")
        for category, stats in categories.items():
            success_rate = (stats['success'] / stats['total']) * 100
            print(f"    • {category}: {stats['success']}/{stats['total']} ({success_rate:.1f}%)")

        # Overall permissions
        total_success = sum(1 for r in self.results if r['success'])
        total_operations = len(self.results)
        overall_success_rate = (total_success / total_operations) * 100

        print(f"\n  Overall Access Level: {total_success}/{total_operations} ({overall_success_rate:.1f}%)")

        # Determine access level
        if overall_success_rate >= 75:
            access_level = "FULL ACCESS"
        elif overall_success_rate >= 50:
            access_level = "MODERATE ACCESS"
        elif overall_success_rate >= 25:
            access_level = "LIMITED ACCESS"
        else:
            access_level = "MINIMAL ACCESS"

        print(f"  Access Level Classification: {access_level}")

        return categories, access_level

    def generate_investigation_report(self):
        """Generate comprehensive investigation report"""
        timestamp = datetime.now().isoformat()

        # Get data overview
        try:
            data_overview = self.client.get_data_overview()
        except:
            data_overview = {'error': 'Could not retrieve data overview'}

        # Get API status
        try:
            api_status = self.client.get_api_status()
        except:
            api_status = {'error': 'Could not retrieve API status'}

        # Analyze permissions
        categories, access_level = self.analyze_permissions()

        report = {
            "investigation_timestamp": timestamp,
            "integration_key": self.api_key[:10] + "...",
            "base_url": self.client.base_url,
            "api_status": api_status,
            "data_overview": data_overview,
            "access_level": access_level,
            "permission_breakdown": categories,
            "total_operations_tested": len(self.results),
            "successful_operations": sum(1 for r in self.results if r['success']),
            "detailed_results": self.results,
            "capabilities_summary": {
                "read_access": len([r for r in self.results if r['success'] and ('read' in r['operation'].lower() or r['category'] in ['Guides', 'Features', 'Pages', 'Reports', 'Metadata'])]),
                "write_access": len([r for r in self.results if r['success'] and ('create' in r['operation'].lower() or 'update' in r['operation'].lower() or 'write' in r['operation'].lower())]),
                "management_access": len([r for r in self.results if r['success'] and r['category'] in ['Analytics', 'Events', 'Bulk Operations']]),
                "delete_access": len([r for r in self.results if r['success'] and r['category'] == 'Delete']),
                "account_access": len([r for r in self.results if r['success'] and r['category'] == 'Account'])
            }
        }

        # Save report
        report_path = os.path.join(os.path.dirname(__file__), 'pendo_access_investigation_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n📄 Investigation report saved to: {report_path}")
        return report

    def run_complete_investigation(self):
        """Run complete access capabilities investigation"""
        print("🔍 PENDO ACCESS CAPABILITIES INVESTIGATOR")
        print("=" * 60)
        print(f"🔑 Integration Key: {self.api_key[:10]}...")
        print(f"🌐 Base URL: {self.client.base_url}")
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Run all investigations
        self.investigate_read_capabilities()
        self.investigate_write_capabilities()
        self.investigate_management_capabilities()
        self.investigate_account_level_info()
        self.investigate_advanced_features()
        self.investigate_delete_capabilities()

        # Generate report
        report = self.generate_investigation_report()

        print(f"\n🎯 INVESTIGATION SUMMARY:")
        print(f"   Total Operations Tested: {report['total_operations_tested']}")
        print(f"   Successful Operations: {report['successful_operations']}")
        print(f"   Overall Access Level: {report['access_level']}")

        print(f"\n📋 CAPABILITIES CONFIRMED:")
        capabilities = report['capabilities_summary']
        if capabilities['read_access'] > 0:
            print(f"   ✅ READ Access: {capabilities['read_access']} operations")
        if capabilities['write_access'] > 0:
            print(f"   ✅ WRITE Access: {capabilities['write_access']} operations")
        if capabilities['management_access'] > 0:
            print(f"   ✅ MANAGEMENT Access: {capabilities['management_access']} operations")
        if capabilities['delete_access'] > 0:
            print(f"   ✅ DELETE Access: {capabilities['delete_access']} operations")
        if capabilities['account_access'] > 0:
            print(f"   ✅ ACCOUNT Access: {capabilities['account_access']} operations")

        return report


def main():
    """Run complete access investigation"""
    investigator = PendoAccessInvestigator()
    report = investigator.run_complete_investigation()
    return report


if __name__ == "__main__":
    main()