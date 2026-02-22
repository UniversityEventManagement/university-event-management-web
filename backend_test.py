
"""
University Event Management System - Backend API Tests
Tests all endpoints with different user roles: Admin, Faculty, Student
"""

import requests
import sys
import json
from datetime import datetime

class UniversityEventAPITester:
    def __init__(self, base_url="https://uni-events-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}
        self.users = {}
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0

    def print_test_header(self, title):
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print('='*60)

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, role=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        
        if role and role in self.tokens:
            test_headers['Authorization'] = f'Bearer {self.tokens[role]}'
        elif headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        if role:
            print(f"   Role: {role}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No error detail')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"   ❌ FAILED - Exception: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test login for all user roles"""
        self.print_test_header("AUTHENTICATION TESTS")
        
        # Test login for all roles
        credentials = [
            ("admin", "admin@university.edu", "admin123"),
            ("faculty", "faculty@university.edu", "faculty123"),
            ("student", "student@university.edu", "student123")
        ]
        
        for role, email, password in credentials:
            success, response = self.run_test(
                f"{role.title()} Login",
                "POST",
                "auth/login",
                200,
                data={"email": email, "password": password}
            )
            
            if success and 'token' in response:
                self.tokens[role] = response['token']
                self.users[role] = response['user']
                print(f"   🎫 {role.title()} token acquired")
            else:
                print(f"   ❌ Failed to get {role} token")
                return False
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST", 
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )
        
        return True

    def test_dashboard_stats(self):
        """Test dashboard stats for all roles"""
        self.print_test_header("DASHBOARD STATS TESTS")
        
        for role in ['admin', 'faculty', 'student']:
            success, stats = self.run_test(
                f"{role.title()} Dashboard Stats",
                "GET",
                "dashboard/stats",
                200,
                role=role
            )
            if success:
                print(f"   📊 {role.title()} Stats: {stats}")

    def test_user_management(self):
        """Test user management (admin only)"""
        self.print_test_header("USER MANAGEMENT TESTS")
        
        # Admin should be able to view all users
        success, users = self.run_test(
            "Admin View All Users",
            "GET",
            "users",
            200,
            role='admin'
        )
        if success:
            print(f"   👥 Found {len(users)} users")
        
        # Faculty should NOT be able to view all users
        self.run_test(
            "Faculty Access Denied - View Users",
            "GET",
            "users", 
            403,
            role='faculty'
        )
        
        # Student should NOT be able to view all users
        self.run_test(
            "Student Access Denied - View Users",
            "GET",
            "users",
            403,
            role='student'
        )

    def test_event_management(self):
        """Test event CRUD operations"""
        self.print_test_header("EVENT MANAGEMENT TESTS")
        
        # Get all events (public endpoint)
        success, events = self.run_test(
            "Get All Events",
            "GET",
            "events",
            200
        )
        if success:
            print(f"   📅 Found {len(events)} existing events")
        
        # Test event creation by admin
        test_event = {
            "title": "Test Admin Event 2026",
            "description": "A test event created by admin for API testing",
            "category": "technical",
            "date": "2026-03-15",
            "time": "14:00",
            "venue": "Test Auditorium",
            "max_participants": 50,
            "organizer": "Admin Test",
            "department": "IT Testing"
        }
        
        success, admin_event = self.run_test(
            "Admin Create Event",
            "POST",
            "events",
            200,
            data=test_event,
            role='admin'
        )
        
        if success:
            self.test_data['admin_event_id'] = admin_event['id']
            print(f"   ✨ Admin created event: {admin_event['id']}")
        
        # Test event creation by faculty
        faculty_event = test_event.copy()
        faculty_event['title'] = "Test Faculty Event 2026"
        faculty_event['organizer'] = "Faculty Test"
        
        success, faculty_event_result = self.run_test(
            "Faculty Create Event",
            "POST", 
            "events",
            200,
            data=faculty_event,
            role='faculty'
        )
        
        if success:
            self.test_data['faculty_event_id'] = faculty_event_result['id']
            print(f"   ✨ Faculty created event: {faculty_event_result['id']}")
        
        # Test student cannot create event
        self.run_test(
            "Student Cannot Create Event",
            "POST",
            "events",
            403,
            data=test_event,
            role='student'
        )

    def test_event_operations(self):
        """Test event update/delete operations"""
        self.print_test_header("EVENT OPERATIONS TESTS")
        
        if 'admin_event_id' in self.test_data:
            # Test event update by admin
            update_data = {
                "title": "Updated Admin Event 2026",
                "status": "ongoing"
            }
            
            success, _ = self.run_test(
                "Admin Update Event",
                "PUT",
                f"events/{self.test_data['admin_event_id']}",
                200,
                data=update_data,
                role='admin'
            )
            
            # Test get specific event
            self.run_test(
                "Get Specific Event",
                "GET",
                f"events/{self.test_data['admin_event_id']}",
                200
            )

    def test_registration_system(self):
        """Test event registration system"""
        self.print_test_header("REGISTRATION SYSTEM TESTS")
        
        if 'admin_event_id' not in self.test_data:
            print("   ⚠️  Skipping registration tests - no test event available")
            return
        
        event_id = self.test_data['admin_event_id']
        
        # Student registers for event
        success, registration = self.run_test(
            "Student Register for Event",
            "POST",
            "registrations",
            200,
            data={"event_id": event_id},
            role='student'
        )
        
        if success:
            self.test_data['registration_id'] = registration['id']
            print(f"   🎯 Student registered: {registration['id']}")
        
        # Test duplicate registration (should fail)
        self.run_test(
            "Duplicate Registration Should Fail",
            "POST",
            "registrations",
            400,
            data={"event_id": event_id},
            role='student'
        )
        
        # Get student's registrations
        success, my_regs = self.run_test(
            "Get My Registrations",
            "GET",
            "registrations/my",
            200,
            role='student'
        )
        if success:
            print(f"   📋 Student has {len(my_regs)} registrations")
        
        # Admin/Faculty view event registrations
        success, event_regs = self.run_test(
            "Admin View Event Registrations", 
            "GET",
            f"registrations/event/{event_id}",
            200,
            role='admin'
        )
        if success:
            print(f"   👥 Event has {len(event_regs)} registrations")

    def test_registration_capacity(self):
        """Test registration capacity limits"""
        self.print_test_header("REGISTRATION CAPACITY TESTS")
        
        # Create event with capacity of 1
        small_event = {
            "title": "Small Capacity Event",
            "description": "Event with only 1 slot for testing",
            "category": "seminar",
            "date": "2026-04-01",
            "time": "10:00", 
            "venue": "Small Room",
            "max_participants": 1,
            "organizer": "Test Admin"
        }
        
        success, event = self.run_test(
            "Create Small Capacity Event",
            "POST",
            "events",
            200,
            data=small_event,
            role='admin'
        )
        
        if success:
            small_event_id = event['id']
            
            # Student registers (should succeed)
            success, _ = self.run_test(
                "First Registration (Should Succeed)",
                "POST",
                "registrations",
                200,
                data={"event_id": small_event_id},
                role='student'
            )
            
            # Try to register faculty when full (should fail)
            self.run_test(
                "Registration When Full (Should Fail)",
                "POST",
                "registrations",
                400,
                data={"event_id": small_event_id},
                role='faculty'
            )

    def test_notifications(self):
        """Test notification system"""
        self.print_test_header("NOTIFICATION SYSTEM TESTS")
        
        # Get student notifications
        success, notifications = self.run_test(
            "Get Student Notifications",
            "GET",
            "notifications",
            200,
            role='student'
        )
        if success:
            print(f"   🔔 Student has {len(notifications)} notifications")
            
            # If there are notifications, test marking as read
            if notifications:
                notif_id = notifications[0]['id']
                
                self.run_test(
                    "Mark Notification as Read",
                    "PUT",
                    f"notifications/{notif_id}/read",
                    200,
                    role='student'
                )
                
                self.run_test(
                    "Mark All Notifications as Read",
                    "PUT", 
                    "notifications/read-all",
                    200,
                    role='student'
                )

    def test_role_based_access_control(self):
        """Test role-based access control"""
        self.print_test_header("ROLE-BASED ACCESS CONTROL TESTS")
        
        # Test faculty cannot delete events (only admin can)
        if 'admin_event_id' in self.test_data:
            self.run_test(
                "Faculty Cannot Delete Events",
                "DELETE", 
                f"events/{self.test_data['admin_event_id']}",
                403,
                role='faculty'
            )
        
        # Test student cannot view event registrations
        if 'admin_event_id' in self.test_data:
            self.run_test(
                "Student Cannot View Event Registrations",
                "GET",
                f"registrations/event/{self.test_data['admin_event_id']}",
                403,
                role='student'
            )

    def cleanup_test_data(self):
        """Clean up test data"""
        self.print_test_header("CLEANUP")
        
        # Cancel student registration if exists
        if 'registration_id' in self.test_data:
            self.run_test(
                "Cancel Test Registration",
                "DELETE",
                f"registrations/{self.test_data['registration_id']}",
                200,
                role='student'
            )
        
        # Delete test events if admin
        for event_key in ['admin_event_id', 'faculty_event_id']:
            if event_key in self.test_data:
                # Note: Faculty can only delete their own events, admin can delete any
                role = 'admin' if 'admin' in event_key else 'admin'  # Use admin for cleanup
                
                success, _ = self.run_test(
                    f"Delete {event_key.replace('_', ' ').title()}",
                    "DELETE",
                    f"events/{self.test_data[event_key]}",
                    200,
                    role=role
                )

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting University Event Management System API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        
        try:
            # Core authentication test - must pass
            if not self.test_authentication():
                print("\n❌ Authentication failed. Cannot proceed with other tests.")
                return False
            
            # Run all test suites
            self.test_dashboard_stats()
            self.test_user_management()
            self.test_event_management() 
            self.test_event_operations()
            self.test_registration_system()
            self.test_registration_capacity()
            self.test_notifications()
            self.test_role_based_access_control()
            
            # Cleanup
            self.cleanup_test_data()
            
            # Print results
            print(f"\n{'='*60}")
            print("📊 TEST SUMMARY")
            print('='*60)
            success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
            print(f"Tests Run: {self.tests_run}")
            print(f"Tests Passed: {self.tests_passed}")
            print(f"Tests Failed: {self.tests_run - self.tests_passed}")
            print(f"Success Rate: {success_rate:.1f}%")
            
            if success_rate >= 80:
                print("🎉 Overall Status: GOOD")
                return True
            else:
                print("⚠️  Overall Status: NEEDS ATTENTION")
                return False
                
        except Exception as e:
            print(f"\n💥 Test suite crashed: {str(e)}")
            return False


def main():
    """Main test runner"""
    tester = UniversityEventAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())