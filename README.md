# Social Growth Hub

Build a Full Social Media Customer Management & Growth Dashboard

Create a modern, professional, responsive SaaS-style web application for managing social media customers and tracking their growth.

The platform has two main user roles:

ADMIN

CUSTOMER

The Admin has complete control over customers, accounts, approvals, analytics, reports, and platform management.

Customers have their own secure dashboard where they can monitor their social media growth, account performance, reports, and activity.

1. PLATFORM GOAL

Build a centralized social media management and analytics platform where I, as the Admin, can:

Add and manage customers.

Approve or reject customer registration requests.

View every customer's information.

Monitor customer social media growth.

Track followers and following.

Monitor engagement.

View account performance.

Add/update customer social media accounts.

Create monthly reports.

Send announcements or messages to customers.

See overall business/customer growth.

Manage customer access.

Suspend or reactivate customers.

View platform-wide analytics.

Each customer should have a private dashboard where they can log in and see their own social media growth and reports.

2. AUTHENTICATION & CUSTOMER REGISTRATION

Create a secure authentication system.

Customer registration

Customers should register using:

Full Name

Username

Email Address

Phone Number

Password

Confirm Password

Profile Picture (optional)

Company/Brand Name (optional)

Social Media Handles

Instagram username

Facebook page

TikTok username

YouTube channel

X/Twitter username

Other social media accounts

After registration:

DO NOT immediately give the customer full access.

The account should have a status:

Pending

Approved

Rejected

Suspended

Active

The Admin receives a notification that a new customer is waiting for approval.

The Admin can:

Approve customer

Reject customer

Suspend customer

Reactivate customer

Only after Admin approval should the customer be able to access the main dashboard.

Display a clear message to pending users:

"Your account has been submitted successfully and is awaiting administrator approval."

3. LOGIN

Create a secure login page.

Customers should be able to log in using:

Email or Username

Password

Admin should have a separate secure Admin login.

Include:

Forgot password

Reset password

Remember me

Logout

Session management

Email verification

Secure password hashing

Role-based access control

Never expose passwords in the database or Admin dashboard.

4. ADMIN DASHBOARD

Create a powerful Admin dashboard.

The Admin dashboard should show an overview of the entire platform.

Main Admin statistics

Display cards for:

Total Customers

Active Customers

Pending Customers

Suspended Customers

Total Social Accounts

Total Followers Across Customers

Total Followers Growth

Average Engagement Rate

Customers Growing

Customers Losing Followers

Reports Generated

Monthly Revenue (if billing is added later)

Use attractive charts and graphs.

5. ADMIN CUSTOMER MANAGEMENT

Create a dedicated Customers section.

Display customers in a searchable and filterable table.

Columns:

Profile

Full Name

Username

Email

Status

Social Accounts

Followers

Growth

Engagement

Last Activity

Registration Date

Actions

Admin actions:

View Customer

Edit Customer

Approve

Reject

Suspend

Reactivate

Delete

Reset Password

View Reports

View Analytics

Send Message

Add filters:

All

Active

Pending

Rejected

Suspended

Highest Growth

Lowest Growth

New Customers

Add search functionality.

6. CUSTOMER PROFILE PAGE FOR ADMIN

When the Admin clicks on a customer, open a detailed customer profile.

Show:

Customer Information

Profile photo

Full name

Username

Email

Phone

Company/Brand

Registration date

Account status

Last login

Assigned Admin/Manager

Social Media Accounts

Show connected accounts:

Instagram

Facebook

TikTok

YouTube

X/Twitter

LinkedIn

Other platforms

For each account show:

Username/handle

Followers

Following

Posts

Likes

Comments

Views

Engagement rate

Growth

Last updated

7. SOCIAL MEDIA GROWTH TRACKING

The most important feature is the growth analytics.

The customer should be able to see how their social media accounts are growing over time.

Create interactive charts.

Track:

Current followers

Previous followers

Follower growth

Percentage growth

Following

Posts

Likes

Comments

Shares

Views

Engagement

Engagement rate

Reach

Impressions

Create time filters:

7 Days

30 Days

3 Months

6 Months

12 Months

Custom Date Range

Example:

Instagram

Followers

January: 2,450
February: 2,780
March: 3,140
April: 3,620

Show this visually using a line chart.

Display:

+1,170 Followers
+47.7% Growth

Use positive/negative indicators so customers can immediately understand whether their account is improving or declining.

8. CUSTOMER DASHBOARD

Create a beautiful customer-facing dashboard.

After login, the customer should see:

Welcome section

"Welcome back, [Customer Name]"

Then display:

Total Followers

Followers gained

Engagement Rate

Total Reach

Total Impressions

Total Posts

Account Growth

Growth Overview

Create a large interactive growth chart.

Allow customers to switch between:

Instagram

Facebook

TikTok

YouTube

X/Twitter

All Platforms

Show follower growth over time.

9. CUSTOMER SOCIAL MEDIA CARDS

Create individual cards for every connected social platform.

Example:

Instagram

Followers: 12,450

+850 this month

Growth: +7.3%

Engagement: 6.8%

Posts: 24

Views: 83,500

Status: Growing

Each card should have a button:

View Analytics

10. MONTHLY REPORT

Create a dedicated Monthly Report section.

Every customer should receive a monthly overview.

Example:

August 2026 Social Media Report

Customer: John Smith

Overall Performance

Followers:
12,450

Followers gained:
+850

Growth:
+7.3%

Engagement:
6.8%

Reach:
145,200

Impressions:
290,500

Posts:
24

Monthly Growth

Compare:

Previous Month vs Current Month

Show charts and percentage changes.

Example:

Followers:
11,600 → 12,450
+7.3%

Engagement:
5.9% → 6.8%
+15.2%

Reach:
120,000 → 145,200
+21%

11. MONTHLY REPORT GENERATION

Admin should be able to generate monthly reports for customers.

Admin options:

Generate Report

Edit Report

Preview Report

Send Report

Download PDF

Email Report

Reports should look professional and branded.

Include:

Customer information

Reporting period

Social media performance

Growth charts

Follower growth

Engagement

Reach

Top-performing content

Performance comparison

Recommendations

Admin notes

Overall performance score

12. ADMIN REPORTING DASHBOARD

Create a Reports section for Admin.

Admin can see:

All customer reports

Monthly reports

Report status

Generated date

Customer

Reporting period

Actions:

View

Edit

Generate

Download

Send

Delete

Allow filtering by:

Customer

Month

Platform

Performance

13. CUSTOMER NOTIFICATIONS

Create a notification system.

Customers should receive notifications when:

Their account is approved

Their account is rejected

Their account is suspended

A new monthly report is available

Admin sends a message

Social media data is updated

Important announcements are published

Create a notification bell in the dashboard.

14. ADMIN-CUSTOMER COMMUNICATION

Create a messaging/communication system.

Admin can send a message to:

One customer

Multiple customers

All customers

Customers can read messages from their dashboard.

Include:

Subject

Message

Date

Read/unread status

15. SOCIAL MEDIA DATA ARCHITECTURE

Design the application so social media data can be connected through official APIs in the future.

Do NOT scrape platforms illegally or rely on fake data.

Build the architecture so the system can integrate with official APIs such as:

Instagram/Meta APIs

Facebook/Meta APIs

TikTok APIs

YouTube Data API

X APIs

LinkedIn APIs

For the first version, create a system where Admin can manually enter/update social media metrics if API integration is not yet configured.

Clearly separate:

Manual Data

from

API/Synchronized Data

Show the last data synchronization date.

16. MANUAL SOCIAL MEDIA DATA UPDATE

Admin should be able to manually update:

Followers

Following

Posts

Likes

Comments

Shares

Views

Reach

Impressions

Engagement rate

When new data is entered, save it as a historical record.

Do NOT overwrite previous analytics.

Example:

August 1:
10,000 followers

August 15:
10,450 followers

August 31:
11,000 followers

The system should use these historical records to generate the growth chart.

17. PERFORMANCE SCORE

Create an overall customer performance score from 0–100.

Calculate the score using factors such as:

Follower growth

Engagement

Reach

Content activity

Views

Audience growth

Display:

Overall Performance: 87/100

Status:

🟢 Excellent

or

🟡 Needs Improvement

or

🔴 Poor

The scoring system should be configurable by Admin.

18. CUSTOMER GOALS

Allow Admin to set customer goals.

Example:

Current followers:
10,000

Target:
20,000

Deadline:
December 31, 2026

Show a progress bar:

10,000 / 20,000

50% Complete

Customers should be able to see their goals and progress.

19. ADMIN OVERALL BUSINESS ANALYTICS

Create an Admin analytics page.

Show:

Total customers

New customers this month

Customer retention

Customer growth

Total followers managed

Total follower growth

Average customer growth

Best-performing customer

Fastest-growing customer

Customers needing attention

Create charts for:

Customer growth

Total follower growth

Monthly performance

Platform distribution

Customer activity

20. CUSTOMER RANKING

Create an optional customer performance ranking.

Example:

Customer A — +25.4%

Customer B — +18.7%

Customer C — +14.2%

Customer D — +9.8%

Only show rankings to Admin by default.

Allow Admin to decide whether customers can see rankings.

21. DESIGN

Use a premium modern SaaS dashboard design.

The interface should feel professional, clean, and trustworthy.

Use:

Responsive design

Desktop layout

Tablet layout

Mobile layout

Sidebar navigation

Top navigation

Cards

Charts

Tables

Modal windows

Toast notifications

Search

Filters

Pagination

Loading states

Empty states

Error states

Use a professional visual hierarchy with plenty of whitespace.

Avoid making the UI look like a generic template.

22. ADMIN SIDEBAR

Create these Admin navigation items:

Dashboard

Customers

Pending Approvals

Social Accounts

Analytics

Reports

Messages

Notifications

Goals

Settings

Admin Profile

Logout

23. CUSTOMER SIDEBAR

Create these Customer navigation items:

Dashboard

My Social Accounts

Growth Analytics

Monthly Reports

Goals

Notifications

Messages

Profile

Settings

Logout

24. SECURITY

Security is extremely important.

Implement:

Secure authentication

Password hashing

Role-based authorization

Protected routes

Admin-only routes

Customer-only routes

Session expiration

Email verification

Password reset

Input validation

Server-side authorization

Protection against unauthorized access

Secure API handling

A customer must NEVER be able to access another customer's data.

Admin should have access to all customer records.

25. DATABASE

Design a proper relational database.

Suggested tables:

users

id

full_name

username

email

password_hash

phone

role

status

profile_image

created_at

updated_at

last_login

customer_profiles

id

user_id

company_name

bio

notes

assigned_admin

created_at

social_accounts

id

customer_id

platform

username

profile_url

connection_status

data_source

last_synced_at

social_metrics

id

social_account_id

date

followers

following

posts

likes

comments

shares

views

reach

impressions

engagement_rate

monthly_reports

id

customer_id

month

year

summary

performance_score

report_status

created_at

goals

id

customer_id

platform

metric

starting_value

target_value

deadline

current_value

status

notifications

id

user_id

title

message

read

created_at

messages

id

sender_id

recipient_id

subject

message

read

created_at

audit_logs

id

admin_id

action

target_user_id

details

created_at

26. ADMIN AUDIT LOG

Track important Admin actions.

Examples:

"Admin approved customer John Smith."

"Admin updated Instagram followers for John Smith."

"Admin generated August monthly report."

"Admin suspended customer XYZ."

Display:

Admin

Action

Customer

Date

Time

This helps with accountability and security.

27. SEARCH & FILTERING

Make the application highly searchable.

Admin should be able to search customers by:

Name

Username

Email

Company

Social media username

Add sorting by:

Newest

Oldest

Highest growth

Lowest growth

Most followers

Highest engagement

28. RESPONSIVE MOBILE DESIGN

The customer dashboard must work perfectly on mobile.

On mobile:

Sidebar becomes a mobile menu.

Charts resize properly.

Cards stack vertically.

Tables become horizontally scrollable or responsive cards.

Navigation remains easy to use.

Admin dashboard should also work on mobile.

29. DARK MODE

Add:

Light mode

Dark mode

Remember the user's preference.

30. SYSTEM SETTINGS

Admin Settings should include:

Platform name

Logo

Brand colors

Email settings

Notification settings

Report settings

Performance score settings

Customer approval settings

Social API settings

Security settings

31. EMAIL SYSTEM

Prepare the application for transactional emails.

Emails should be sent for:

Customer registration

Account approval

Account rejection

Password reset

Monthly report available

Admin message

Important notifications

Create professional email templates.

32. IMPORTANT BUSINESS RULE

Customers must NEVER have access to Admin functionality.

Customers should ONLY see their own:

Profile

Social media accounts

Analytics

Growth

Reports

Goals

Messages

Notifications

Admin can see and manage everything.

33. DASHBOARD UX

The first thing a customer sees after login should immediately answer:

"How is my social media performing?"

Show:

Current followers

Followers gained this month

Growth percentage

Engagement rate

Reach

Performance score

Growth chart

Platform performance

Monthly report

Current goals

Make the information visually easy to understand.

34. ADMIN UX

The first thing the Admin sees should answer:

"How are all my customers performing?"

Show:

Total customers

Pending approvals

Total followers managed

Total growth

Best-performing customers

Customers needing attention

Recent registrations

Recent activity

Reports

Notifications

35. TECHNICAL REQUIREMENTS

Build this as a production-ready application rather than a static landing page.

Use:

Modern frontend framework

Secure backend

Relational database

REST API or equivalent backend architecture

Authentication

Authorization

Database migrations

Form validation

Error handling

API error handling

Loading states

Empty states

Responsive components

Reusable UI components

Keep the architecture modular so additional social media platforms and features can be added later.

36. DEMO DATA

For development/demo purposes, create realistic sample data.

Create:

5–10 sample customers

Multiple social media accounts

Several months of follower history

Monthly reports

Goals

Notifications

Messages

The charts should look realistic using sample data.

Clearly mark demo/sample data so it can be removed later.

37. FINAL PRODUCT

The final application should feel like a real commercial social media management SaaS platform.

It should have:

Admin Portal

Complete control over customers, approvals, accounts, analytics, reports, goals, notifications, messaging, and settings.

Customer Portal

A personalized dashboard showing social media growth, analytics, reports, goals, notifications, and messages.

Core Experience

A customer registers → Admin receives approval request → Admin approves customer → Customer logs in → Customer sees personalized dashboard → Social media metrics are tracked over time → Growth charts are generated → Monthly report is created → Customer receives notification → Customer views/downloads report.

38. BUILD PRIORITY

Build in this order:

Phase 1

Authentication + database + Admin/Customer roles

Phase 2

Customer registration + Admin approval system

Phase 3

Admin customer management

Phase 4

Customer dashboard

Phase 5

Social media accounts + historical metrics

Phase 6

Growth charts and analytics

Phase 7

Monthly reports

Phase 8

Notifications + messaging

Phase 9

Goals + performance scoring

Phase 10

Social media API integrations

Phase 11

Security hardening + testing

Phase 12

Responsive/mobile optimization

IMPORTANT

Do not build only a visual prototype.

Build the actual functional application with a real database, authentication, protected routes, role-based permissions, CRUD operations, historical analytics, report generation, and a scalable architecture.

If a social media API cannot be connected yet, create the correct database structure and manual metric-update functionality so API integrations can be added later.

Prioritize security, data isolation between customers, clean UX, scalability, and maintainability.

The application should be designed as a serious production-ready SaaS platform, not merely a dashboard mockup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swiiftiphones-agency-social-media-growth.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/13c96be7-c1ac-4e08-b4ed-4f45edd39ec6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
