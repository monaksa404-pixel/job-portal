# JOB PORTAL SYSTEM - COMPLETE TECHNICAL IMPLEMENTATION PLAN

## TECH STACK

Frontend:

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend:

* Supabase

Services:

* Supabase Auth
* Supabase Database (PostgreSQL)
* Supabase Storage
* Supabase Realtime
* Telegram Bot API

---

# USER ROLES

## 1. User

Can:

* Register/Login
* Browse Jobs
* Apply For Jobs
* Upload Documents
* Track Applications
* Receive Notifications
* Receive Messages
* View Popups

---

## 2. Admin

Can:

* Manage Categories
* Publish Jobs
* Review Applications
* Approve/Reject Applications
* Verify Payment Pins
* Send Messages
* Send Notifications
* Send User Popups

---

# HOMEPAGE

Top Navigation:

* Home
* Categories
* Jobs
* My Applications
* Notifications

---

# JOB CATEGORIES

Admin can create unlimited categories.

Default Categories:

* Healthcare
* Driver
* Electrician
* Technician
* Construction
* Hotel
* Restaurant
* IT
* Sales
* Security
* Factory
* Cleaner
* Other

Category Fields:

* id
* name
* icon
* status
* created_at

---

# JOB MANAGEMENT

Admin Dashboard

Create New Job

Fields:

* Job Title
* Category
* Salary
* Location
* Duty Timing
* Experience Required

Vacancies:

* Male Required
* Female Required

Facilities:

* Free Accommodation
* Free Food
* Free Transport
* Medical Insurance
* Overtime

Application Fee:

Admin can set any fee per job.

Examples:

* 5 SAR
* 10 SAR
* 20 SAR
* 50 SAR

Job Description

Publish Job

---

# JOB LISTING CARD

Display:

* Job Title
* Salary
* Location
* Duty Timing
* Experience Required
* Male Required
* Female Required
* Accommodation
* Food
* Transport
* Application Fee

Button:

Apply Now

---

# APPLICATION FLOW

User clicks:

Apply Now

---

# APPLICATION FORM

## Personal Information

* Full Name
* WhatsApp Number
* Email Address (Optional)
* Nationality
* Current Country

Gender:

* Male
* Female

---

## Job Information

* Experience

---

## Documents

CV Upload (Optional)

Passport Copy Upload (Optional)

Files stored in:

Supabase Storage

Folders:

/cv
/passport

---

## Payment Section

Show:

Application Fee

(from selected job)

---

# PAYMENT FLOW (NO REAL PAYMENT GATEWAY)

IMPORTANT:

No online payment integration.

No Stripe.

No PayPal.

No STC API.

No payment gateway.

Workflow:

User enters STC Recharge PIN.

Field:

Enter Recharge PIN

Example:

123456789012345

When Submit Application is clicked:

1. Save application in database.
2. Status = Pending Payment Verification.
3. Send recharge pin details to Telegram Bot.
4. Admin receives instant Telegram message.
5. Admin checks STC recharge pin manually.
6. Admin verifies pin from Admin Dashboard.
7. Admin changes payment status.

Payment Status:

* Pending
* Verified
* Rejected

Only after verification application continues.

---

# TELEGRAM BOT INTEGRATION

Environment Variables:

TELEGRAM_BOT_TOKEN

TELEGRAM_CHAT_ID

When application submitted:

Send Telegram Message:

New Application Received

Application ID: APP-45821

Applicant: Muhammad Hassan

Job: Driver

WhatsApp: +923xxxxxxxxx

Recharge PIN:
123456789012345

Payment Status:
Pending Verification

Admin receives instantly.

---

# AFTER APPLICATION SUBMISSION

Generate Unique Application ID

Format:

APP-00001
APP-00002
APP-00003

or

APP-45821

Store in database.

Default Status:

Under Review

Display to user:

Application Submitted Successfully

Application ID:
APP-45821

Status:
Under Review

---

# USER DASHBOARD

Sections:

## Applied Jobs

Display:

* Application ID
* Job Title
* Application Date
* Status

---

## Application Status

Possible Statuses:

* Under Review
* Accepted
* Rejected

---

## Notifications

Show user-specific notifications only.

---

## Messages

Show admin messages only for that user.

---

# ADMIN APPLICATION PANEL

Display:

* Application ID
* Applicant Name
* WhatsApp Number
* Nationality
* Gender
* Experience
* CV File
* Passport Copy
* STC Recharge PIN
* Payment Status
* Applied Job
* Submission Date

Actions:

* Verify Payment
* Reject Payment
* Accept Application
* Reject Application
* Send Message
* Send Notification
* Send Popup

---

# APPLICATION STATUS SYSTEM

Statuses:

UNDER_REVIEW

ACCEPTED

REJECTED

Displayed to users:

🟡 Under Review

🟢 Accepted

🔴 Rejected

---

# CUSTOM MESSAGE SYSTEM

Admin can send messages to specific applicants.

Examples:

Your application has been accepted.

Please upload additional documents.

Contact us on WhatsApp.

Your visa process has started.

Please visit our office.

Messages appear:

* Dashboard Messages
* Notification Center

Only visible to selected applicant.

---

# NOTIFICATION SYSTEM

Admin creates notification.

Notification linked to:

user_id

Notification appears:

* Bell Icon
* Notifications Page

Fields:

* Title
* Message
* Read Status
* Created Date

Realtime updates using Supabase Realtime.

---

# POPUP SYSTEM

Admin can send popup to specific user.

Examples:

Your application has been accepted.

Please check your notifications.

Upload additional documents.

Contact our office.

Flow:

User Login

↓

Check pending popup

↓

Show modal popup

↓

User closes popup

↓

Mark popup as viewed

Only visible to assigned user.

---

# COMPLETE USER FLOW

Homepage

↓

Select Category

↓

Open Job

↓

Apply Now

↓

Fill Application Form

↓

Upload CV (Optional)

↓

Upload Passport Copy (Optional)

↓

Enter STC Recharge PIN

↓

Submit Application

↓

Application Saved

↓

Telegram Bot Receives PIN

↓

Application ID Generated

↓

Status = Under Review

↓

Admin Reviews

↓

Admin Verifies Recharge PIN

↓

Accept / Reject Application

↓

Admin Sends Message

↓

Notification Bell Updated

↓

Popup Displayed

↓

User Receives Updates

---

# SUPABASE DATABASE TABLES

## users

* id
* full_name
* phone
* email
* nationality
* country
* gender
* role
* created_at

---

## categories

* id
* name
* icon
* status
* created_at

---

## jobs

* id
* title
* category_id
* salary
* location
* duty_timing
* experience_required
* male_required
* female_required
* accommodation
* food
* transport
* medical_insurance
* overtime
* application_fee
* description
* status
* created_at

---

## applications

* id
* application_id
* user_id
* job_id
* experience
* cv_url
* passport_url
* recharge_pin
* payment_status
* application_status
* created_at

---

## messages

* id
* user_id
* application_id
* message
* created_at

---

## notifications

* id
* user_id
* title
* message
* is_read
* created_at

---

## popups

* id
* user_id
* title
* message
* is_viewed
* created_at

---

# SECURITY

Use Supabase RLS Policies

User can only:

* View own applications
* View own messages
* View own notifications
* View own popups

Admin can:

* Manage everything

---

# FINAL REQUIREMENT

Build exactly according to this workflow.

No payment gateway integration.

STC Recharge PIN is manually verified by admin.

Recharge PIN must automatically be sent to Telegram Bot after application submission.

All notifications, messages, popups and application statuses must be user-specific and real-time using Supabase Realtime.


Hi, below are all the features we need to implement for both the User side and Admin side using **Supabase** as the backend.

### User Side

* User authentication (Sign Up / Login / Logout).
* Homepage with top navigation: Home, Categories, Jobs, My Applications, Notifications.
* Display all job categories with icons.
* Show jobs by category.
* Job details page with complete information (salary, location, duty timing, experience, vacancies, facilities, application fee, description).
* Apply Now functionality.
* Application form with:

  * Full Name
  * WhatsApp Number
  * Email (Optional)
  * Nationality
  * Current Country
  * Gender
  * Experience
  * CV Upload (Optional)
  * Passport Copy Upload (Optional)
  * STC Recharge PIN field
* Upload files to Supabase Storage.
* On application submission:

  * Generate unique Application ID.
  * Save application in Supabase.
  * Default status should be **Under Review**.
  * Payment status should be **Pending Verification**.
  * Automatically send the entered STC Recharge PIN and applicant details to our Telegram Bot (using Bot Token and Chat ID that we will provide).
* User Dashboard showing:

  * Applied Jobs
  * Application Status
  * Notifications
  * Messages from Admin
* Notification Bell with unread count.
* Notifications page showing only that user's notifications.
* Popup system where user sees popup messages after login if sent by admin.
* Users should only be able to access their own applications, messages, notifications, and popups.

### Admin Side

* Secure Admin Dashboard.
* Manage unlimited job categories (Create, Edit, Delete).
* Publish/Edit/Delete Jobs.
* Job fields should include:

  * Job Title
  * Category
  * Salary
  * Location
  * Duty Timing
  * Experience Required
  * Male Required
  * Female Required
  * Free Accommodation
  * Free Food
  * Free Transport
  * Medical Insurance
  * Overtime
  * Application Fee
  * Job Description
* View all applications.
* Application details should include:

  * Applicant Name
  * WhatsApp Number
  * Nationality
  * Gender
  * Experience
  * CV
  * Passport Copy
  * STC Recharge PIN
  * Payment Status
  * Applied Job
* Admin manually verifies the STC Recharge PIN (no payment gateway integration).
* Payment statuses:

  * Pending
  * Verified
  * Rejected
* Application statuses:

  * Under Review
  * Accepted
  * Rejected
* Admin should be able to:

  * Verify Payment
  * Reject Payment
  * Accept Application
  * Reject Application
  * Send Custom Message to a specific applicant
  * Send Notification to a specific applicant
  * Send Popup to a specific applicant
* Messages, notifications, and popups must only be visible to the selected user.
* Use Supabase Realtime so users receive updates immediately without refreshing.

### Backend Requirements

* Use Supabase Authentication.
* Use Supabase PostgreSQL Database.
* Use Supabase Storage for CV and Passport uploads.
* Use Supabase Realtime for notifications and status updates.
* Implement proper Row Level Security (RLS) so users can only access their own data while the admin has full access.
* Integrate Telegram Bot API so every submitted application automatically sends the recharge PIN and applicant details to the configured Telegram chat for manual verification.

The application flow should be exactly:

Homepage → Category → Job Details → Apply Now → Fill Form → Upload Documents → Enter STC Recharge PIN → Submit → Application ID Generated → Under Review → Admin Verifies Payment → Admin Accepts/Rejects → Admin Sends Message/Notification/Popup → User Receives Updates.
