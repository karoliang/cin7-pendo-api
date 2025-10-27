#!/usr/bin/env python3
"""
Pendo API Integration Test Script
Tests all major API endpoints and documents capabilities
"""

import os
import sys
import json
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pendo_client import PendoAPIClient, PendoAPIError


def test_api_connection(client):
    """Test basic API connection"""
    print("🔗 Testing API connection...")
    try:
        if client.test_connection():
            print("✅ API connection successful")
            return True
        else:
            print("❌ API connection failed")
            return False
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False


def test_campaign_endpoints(client):
    """Test campaign management endpoints"""
    print("\n📢 Testing Campaign Management API...")

    try:
        # List campaigns
        print("  • Listing campaigns...")
        campaigns = client.list_campaigns(limit=5)
        campaign_count = len(campaigns.get('data', []))
        print(f"    Found {campaign_count} campaigns")

        if campaign_count > 0:
            # Get first campaign details
            first_campaign = campaigns['data'][0]
            campaign_id = first_campaign.get('id')
            print(f"    Testing campaign {campaign_id} details...")

            # Get campaign details
            details = client.get_campaign(campaign_id)
            print(f"    Campaign name: {details.get('name', 'N/A')}")

            # Get campaign analytics
            analytics = client.get_campaign_analytics(campaign_id)
            print(f"    Analytics available: {bool(analytics)}")

        return True

    except PendoAPIError as e:
        print(f"  ❌ Campaign API test failed: {e}")
        return False


def test_analytics_endpoints(client):
    """Test analytics endpoints"""
    print("\n📊 Testing Analytics API...")

    try:
        # Get user analytics
        print("  • Retrieving user analytics...")
        user_analytics = client.get_user_analytics()
        print(f"    User analytics retrieved: {bool(user_analytics)}")

        # Get feature analytics
        print("  • Retrieving feature analytics...")
        feature_analytics = client.get_feature_analytics()
        print(f"    Feature analytics retrieved: {bool(feature_analytics)}")

        # List events
        print("  • Listing events...")
        events = client.get_events(limit=5)
        event_count = len(events.get('data', []))
        print(f"    Found {event_count} recent events")

        return True

    except PendoAPIError as e:
        print(f"  ❌ Analytics API test failed: {e}")
        return False


def test_feedback_endpoints(client):
    """Test feedback endpoints"""
    print("\n💬 Testing Feedback API...")

    try:
        # List feedback
        print("  • Listing feedback...")
        feedback = client.list_feedback(limit=5)
        feedback_count = len(feedback.get('data', []))
        print(f"    Found {feedback_count} feedback entries")

        # Get sentiment analysis
        print("  • Retrieving sentiment analysis...")
        sentiment = client.get_sentiment_analysis()
        print(f"    Sentiment analysis available: {bool(sentiment)}")

        # Get NPS scores
        print("  • Retrieving NPS scores...")
        nps = client.get_nps_scores()
        print(f"    NPS data available: {bool(nps)}")

        return True

    except PendoAPIError as e:
        print(f"  ❌ Feedback API test failed: {e}")
        return False


def test_metadata_endpoints(client):
    """Test metadata management endpoints"""
    print("\n📋 Testing Metadata Management API...")

    try:
        # List users
        print("  • Listing users...")
        users = client.list_users(limit=5)
        user_count = len(users.get('data', []))
        print(f"    Found {user_count} users")

        # List accounts
        print("  • Listing accounts...")
        accounts = client.list_accounts(limit=5)
        account_count = len(accounts.get('data', []))
        print(f"    Found {account_count} accounts")

        return True

    except PendoAPIError as e:
        print(f"  ❌ Metadata API test failed: {e}")
        return False


def test_guide_endpoints(client):
    """Test guide management endpoints"""
    print("\n📖 Testing Guide Management API...")

    try:
        # List guides
        print("  • Listing guides...")
        guides = client.list_guides(limit=5)
        guide_count = len(guides.get('data', []))
        print(f"    Found {guide_count} guides")

        if guide_count > 0:
            # Get first guide analytics
            first_guide = guides['data'][0]
            guide_id = first_guide.get('id')
            print(f"  • Testing guide {guide_id} analytics...")

            analytics = client.get_guide_analytics(guide_id)
            print(f"    Guide analytics available: {bool(analytics)}")

        return True

    except PendoAPIError as e:
        print(f"  ❌ Guide API test failed: {e}")
        return False


def generate_report(results):
    """Generate test report"""
    timestamp = datetime.now().isoformat()

    report = {
        "test_timestamp": timestamp,
        "api_key": os.getenv('PENDO_API_KEY', 'Not configured'),
        "base_url": os.getenv('PENDO_BASE_URL', 'https://api.pendo.io'),
        "results": results,
        "summary": {
            "total_tests": len(results),
            "passed": sum(1 for r in results.values() if r),
            "failed": sum(1 for r in results.values() if not r)
        }
    }

    # Save report to file
    report_path = os.path.join(os.path.dirname(__file__), 'api_test_report.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Test report saved to: {report_path}")

    # Print summary
    print(f"\n📊 Test Summary:")
    print(f"   Total tests: {report['summary']['total_tests']}")
    print(f"   Passed: {report['summary']['passed']}")
    print(f"   Failed: {report['summary']['failed']}")

    return report


def main():
    """Run comprehensive API integration tests"""
    print("🚀 Pendo.io API Integration Test Suite")
    print("=" * 50)

    # Initialize client
    try:
        client = PendoAPIClient()
        print(f"🔑 Using API key: {client.api_key[:10]}...")
    except ValueError as e:
        print(f"❌ Client initialization failed: {e}")
        return

    # Run tests
    results = {}

    # Test connection first
    if not test_api_connection(client):
        print("\n❌ Cannot proceed without valid API connection")
        return

    # Test all API categories
    results['campaigns'] = test_campaign_endpoints(client)
    results['analytics'] = test_analytics_endpoints(client)
    results['feedback'] = test_feedback_endpoints(client)
    results['metadata'] = test_metadata_endpoints(client)
    results['guides'] = test_guide_endpoints(client)

    # Generate report
    report = generate_report(results)

    print(f"\n🎉 Testing completed!")

    if all(results.values()):
        print("✅ All API endpoints are working correctly")
    else:
        failed_tests = [name for name, passed in results.items() if not passed]
        print(f"⚠️  Some tests failed: {', '.join(failed_tests)}")


if __name__ == "__main__":
    main()