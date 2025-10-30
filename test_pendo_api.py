#!/usr/bin/env python3
"""
Test script to explore Pendo API endpoints and find what data is actually available.
"""

import requests
import json
import os
from datetime import datetime, timedelta

# Get API key from environment or use test key
API_KEY = os.getenv('VITE_PENDO_API_KEY') or os.getenv('PENDO_API_KEY')
if not API_KEY:
    import sys
    if len(sys.argv) > 1:
        API_KEY = sys.argv[1]
    else:
        print("❌ Error: No Pendo API key provided")
        print("Usage:")
        print("  1. Set VITE_PENDO_API_KEY or PENDO_API_KEY environment variable")
        print("  2. Or pass as argument: python test_pendo_api.py YOUR_API_KEY")
        print("\nYou can find your API key at:")
        print("  - Netlify: Site Settings → Environment Variables → VITE_PENDO_API_KEY")
        print("  - Or in your frontend/.env file")
        exit(1)

BASE_URL = "https://app.pendo.io"
HEADERS = {
    "X-Pendo-Integration-Key": API_KEY,
    "Content-Type": "application/json"
}

def test_guides_list():
    """Test the guides list endpoint to see what data is available."""
    print("\n" + "="*80)
    print("1️⃣  TESTING: GET /api/v1/guide (list all guides)")
    print("="*80)

    url = f"{BASE_URL}/api/v1/guide"
    params = {"limit": 10}  # Just get 10 for testing

    try:
        response = requests.get(url, headers=HEADERS, params=params)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            guides = response.json()
            print(f"✅ Retrieved {len(guides)} guides")

            # Show the first guide's structure
            if guides:
                print("\n📋 First guide structure:")
                print(json.dumps(guides[0], indent=2))

                # Check what fields are available
                print("\n🔑 Available fields in guide object:")
                for key in guides[0].keys():
                    print(f"  - {key}")

                # Specifically check for analytics fields
                analytics_fields = ['viewedCount', 'completedCount', 'dismissedCount', 'views', 'completions']
                print("\n📊 Analytics fields present:")
                for field in analytics_fields:
                    value = guides[0].get(field, 'NOT FOUND')
                    print(f"  - {field}: {value}")
        else:
            print(f"❌ Error: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def test_individual_guide(guide_id):
    """Test fetching an individual guide by ID."""
    print("\n" + "="*80)
    print(f"2️⃣  TESTING: GET /api/v1/guide/{guide_id}")
    print("="*80)

    url = f"{BASE_URL}/api/v1/guide/{guide_id}"

    try:
        response = requests.get(url, headers=HEADERS)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            guide = response.json()
            print("✅ Successfully fetched individual guide")
            print(json.dumps(guide, indent=2))
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            print("Note: This endpoint might not be supported by Pendo API")

    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def test_aggregation_api(guide_id):
    """Test the aggregation API to get analytics data."""
    print("\n" + "="*80)
    print(f"3️⃣  TESTING: POST /api/v1/aggregation (guide events)")
    print("="*80)

    url = f"{BASE_URL}/api/v1/aggregation"

    # Calculate last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    # Try different aggregation request formats
    requests_to_try = [
        {
            "name": "Simple guide event aggregation",
            "payload": {
                "source": "guideEvent",
                "timeSeries": {
                    "period": "dayRange",
                    "first": start_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "count": 30
                },
                "filter": f"guideId=='{guide_id}'",
                "requestId": f"test-{guide_id}-{int(datetime.now().timestamp())}"
            }
        },
        {
            "name": "Guide event with operators",
            "payload": {
                "source": "guideEvent",
                "timeSeries": "daily",
                "operators": [
                    {"name": "count", "value": "*"}
                ],
                "filter": f"guideId=='{guide_id}'",
                "first": start_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                "last": end_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            }
        },
        {
            "name": "Pipeline format",
            "payload": {
                "request": {
                    "pipeline": [
                        {
                            "source": "guideEvent",
                            "filter": f"guideId=='{guide_id}'"
                        },
                        {
                            "aggregate": {
                                "groups": ["type"],
                                "aggregations": [
                                    {"type": "count"}
                                ]
                            }
                        }
                    ],
                    "timeSeries": {
                        "period": "dayRange",
                        "first": start_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                        "count": 30
                    }
                }
            }
        }
    ]

    for i, request_config in enumerate(requests_to_try, 1):
        print(f"\n📝 Attempt {i}: {request_config['name']}")
        print(f"Payload: {json.dumps(request_config['payload'], indent=2)}")

        try:
            response = requests.post(url, headers=HEADERS, json=request_config['payload'])
            print(f"Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! Response:")
                print(json.dumps(data, indent=2)[:500])  # First 500 chars
                print("\n🎉 Found working aggregation format!")
                return data
            else:
                print(f"❌ Error {response.status_code}: {response.text[:200]}")

        except Exception as e:
            print(f"❌ Exception: {str(e)}")

    print("\n⚠️  None of the aggregation formats worked")
    return None

def find_guide_with_data():
    """Find a guide that has actual usage data."""
    print("\n" + "="*80)
    print("4️⃣  SEARCHING: Find guides with usage data")
    print("="*80)

    url = f"{BASE_URL}/api/v1/guide"
    params = {"limit": 100}

    try:
        response = requests.get(url, headers=HEADERS, params=params)
        if response.status_code == 200:
            guides = response.json()
            print(f"Retrieved {len(guides)} guides to analyze")

            # Check which guides have data fields
            guides_with_potential_data = []
            for guide in guides:
                # Look for any numeric fields that might indicate usage
                has_data = False
                data_fields = {}

                for key, value in guide.items():
                    if isinstance(value, (int, float)) and value > 0 and key != 'id':
                        data_fields[key] = value
                        has_data = True

                if has_data:
                    guides_with_potential_data.append({
                        'id': guide.get('id'),
                        'name': guide.get('name'),
                        'state': guide.get('state'),
                        'data_fields': data_fields
                    })

            if guides_with_potential_data:
                print(f"\n✅ Found {len(guides_with_potential_data)} guides with numeric data:")
                for g in guides_with_potential_data[:5]:  # Show first 5
                    print(f"\n  ID: {g['id']}")
                    print(f"  Name: {g['name']}")
                    print(f"  State: {g['state']}")
                    print(f"  Data fields: {g['data_fields']}")

                return guides_with_potential_data[0]['id']
            else:
                print("\n⚠️  No guides found with numeric usage data in metadata")
                print("This confirms that analytics data is NOT in the guide metadata")
                return guides[0]['id'] if guides else None
        else:
            print(f"❌ Error: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return None

def main():
    print("\n🔬 PENDO API EXPLORATION SCRIPT")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Key: {API_KEY[:10]}...{API_KEY[-10:]}")
    print("="*80)

    # Test 1: List guides
    test_guides_list()

    # Test 2: Find a guide with potential data
    guide_id = find_guide_with_data()

    if guide_id:
        # Test 3: Try individual guide endpoint
        test_individual_guide(guide_id)

        # Test 4: Try aggregation API
        test_aggregation_api(guide_id)

    print("\n" + "="*80)
    print("🏁 EXPLORATION COMPLETE")
    print("="*80)

if __name__ == "__main__":
    main()
