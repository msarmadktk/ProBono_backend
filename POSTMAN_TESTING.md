# Pro Bono Work API - Postman Testing Guide

This document provides detailed instructions for testing all API endpoints using Postman.

## Table of Contents
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Profiles & Portfolios](#profiles--portfolios)
4. [Jobs & Proposals](#jobs--proposals)
5. [Learning Hub](#learning-hub)
6. [Financial & Transactions](#financial--transactions)
7. [Feedback & Reviews](#feedback--reviews)
8. [Digital Products](#digital-products)
9. [Balance Management](#balance-management)
10. [Invitations](#invitations)
11. [Work History](#work-history)

## Authentication

### Register a New User

- **Method**: POST
- **URL**: `{{baseUrl}}/api/auth/signup`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "test@example.com",
  "password": "password123",
  "user_type": "freelancer"
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "user_type": "freelancer"
  }
}
```

### Login

- **Method**: POST
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **Expected Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "user_type": "freelancer"
  }
}
```
- **Post-Request Script**:
```javascript
var jsonData = pm.response.json();
pm.environment.set("userId", jsonData.user.id);
```

## User Management

### Get User Profile

- **Method**: GET
- **URL**: `{{baseUrl}}/api/users/{{userId}}`
- **Expected Response** (200 OK):
```json
{
  "id": 1,
  "email": "test@example.com",
  "user_type": "freelancer",
  "status": "active",
  "created_at": "2023-05-01T12:00:00.000Z"
}
```

### Update User Profile

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/users/{{userId}}`
- **Body**:
```json
{
  "email": "updated@example.com"
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "email": "updated@example.com",
    "user_type": "freelancer",
    "status": "active"
  }
}
```

### Suspend User (Admin Only)

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/users/{{userId}}/suspend`
- **Expected Response** (200 OK):
```json
{
  "message": "User suspended successfully",
  "user": {
    "id": 1,
    "status": "suspended"
  }
}
```

### Ban User (Admin Only)

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/users/{{userId}}/ban`
- **Expected Response** (200 OK):
```json
{
  "message": "User banned successfully",
  "user": {
    "id": 1,
    "status": "banned"
  }
}
```

## Profiles & Portfolios

### Create Freelancer Profile

- **Method**: POST
- **URL**: `{{baseUrl}}/api/profiles`
- **Body**:
```json
{
  "userId": 1,
  "skills": "JavaScript, Node.js, Express",
  "bio": "Experienced full-stack developer",
  "experience_level": "Intermediate",
  "hourly_rate": 35.00,
  "title": "Full Stack Developer",
  "profile_image": "https://example.com/profile.jpg"
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Profile created successfully",
  "profile": {
    "id": 1,
    "user_id": 1,
    "skills": "JavaScript, Node.js, Express",
    "bio": "Experienced full-stack developer",
    "experience_level": "Intermediate",
    "hourly_rate": 35.00,
    "title": "Full Stack Developer",
    "profile_image": "https://example.com/profile.jpg",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

### Get Freelancer Profile

- **Method**: GET
- **URL**: `{{baseUrl}}/api/profiles/{{userId}}`
- **Expected Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 1,
  "skills": "JavaScript, Node.js, Express",
  "bio": "Experienced full-stack developer",
  "experience_level": "Intermediate",
  "average_rating": 4.85,
  "hourly_rate": 35.00,
  "title": "Full Stack Developer",
  "profile_image": "https://example.com/profile.jpg",
  "created_at": "2023-05-01T12:00:00.000Z"
}
```

### Add Portfolio Item

- **Method**: POST
- **URL**: `{{baseUrl}}/api/profiles/{{userId}}/portfolio`
- **Body**:
```json
{
  "project_title": "E-commerce Website",
  "description": "Built a full-stack e-commerce platform",
  "media_links": "https://example.com/project1.jpg,https://example.com/project2.jpg"
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Portfolio item added successfully",
  "item": {
    "id": 1,
    "profile_id": 1,
    "project_title": "E-commerce Website",
    "description": "Built a full-stack e-commerce platform",
    "media_links": "https://example.com/project1.jpg,https://example.com/project2.jpg",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

### Get Portfolio Items

- **Method**: GET
- **URL**: `{{baseUrl}}/api/profiles/{{userId}}/portfolio`
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "profile_id": 1,
    "project_title": "E-commerce Website",
    "description": "Built a full-stack e-commerce platform",
    "media_links": "https://example.com/project1.jpg,https://example.com/project2.jpg",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
]
```

## Jobs & Proposals

### Search Jobs with Filters

- **Method**: GET
- **URL**: `{{baseUrl}}/api/jobs`
- **Query Parameters**:
  - `location` (optional): Filter by client location (e.g., "United States")
  - `category_id` (optional): Filter by job category ID (e.g., 3 for Web Development)
  - `experienceLevel` (optional): Filter by required experience level ("Entry Level", "Intermediate", "Expert")
  - `jobType` (optional): Filter by job type ("Hourly", "Fixed")
  - `proposals` (optional): Filter by number of proposals:
      - `less_than_5`: Jobs with fewer than 5 proposals
      - `5_to_10`: Jobs with 5 to 10 proposals
      - `20_to_50`: Jobs with 20 to 50 proposals
      - `50_plus`: Jobs with more than 50 proposals
  - `skillsRequired` (optional): Filter by skills required (e.g., "React")
  - `minBudget` (optional): Filter by minimum budget
  - `maxBudget` (optional): Filter by maximum budget
  - `status` (optional): Filter by job status
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Frontend Developer to Build Dashboard MVP",
    "description": "We need an experienced developer to build a responsive dashboard for our application.",
    "skills_required": "React, Next.js, Tailwind CSS",
    "budget": 500.00,
    "status": "approved",
    "client_id": 1,
    "category_id": 3,
    "location": "United States",
    "experience_level": "Expert",
    "job_type": "Hourly",
    "created_at": "2023-05-01T12:00:00.000Z",
    "updated_at": "2023-05-01T12:00:00.000Z",
    "proposal_count": 2
  }
]
```

### Get Job Details

- **Method**: GET
- **URL**: `{{baseUrl}}/api/jobs/{{jobId}}`
- **Expected Response** (200 OK):
```json
{
  "id": 1,
  "title": "Build a RESTful API",
  "description": "Need a developer to build a RESTful API",
  "skills_required": "Node.js, Express, PostgreSQL",
  "budget": 1000.00,
  "status": "approved",
  "client_id": 2,
  "client_email": "client@example.com",
  "created_at": "2023-05-01T12:00:00.000Z"
}
```

### Create Job Posting with Category, Experience Level and Job Type

- **Method**: POST
- **URL**: `{{baseUrl}}/api/jobs`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "title": "Frontend Developer to Build Dashboard MVP",
  "description": "We need an experienced developer to build a responsive dashboard for our application.",
  "skills_required": "React, Next.js, Tailwind CSS",
  "budget": 500.00,
  "clientId": 1,
  "category_id": 3,
  "location": "United States",
  "experienceLevel": "Expert",
  "jobType": "Hourly"
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Job created successfully, pending approval",
  "job": {
    "id": 1,
    "title": "Frontend Developer to Build Dashboard MVP",
    "description": "We need an experienced developer to build a responsive dashboard for our application.",
    "skills_required": "React, Next.js, Tailwind CSS",
    "budget": 500.00,
    "status": "pending",
    "client_id": 1,
    "category_id": 3,
    "location": "United States",
    "experience_level": "Expert",
    "job_type": "Hourly",
    "created_at": "2023-05-01T12:00:00.000Z",
    "updated_at": "2023-05-01T12:00:00.000Z"
  },
  "balance": {
    "available_amount": 975.00,
    "pending_amount": 500.00
  }
}
```

### Approve Job Posting

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/jobs/{{jobId}}/approve`
- **Expected Response** (200 OK):
```json
{
  "message": "Job approved successfully",
  "job": {
    "id": 1,
    "status": "approved"
  }
}
```

### Reject Job Posting

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/jobs/{{jobId}}/reject`
- **Expected Response** (200 OK):
```json
{
  "message": "Job rejected successfully",
  "job": {
    "id": 1,
    "status": "rejected"
  }
}
```

### Submit Proposal

- **Method**: POST
- **URL**: `{{baseUrl}}/api/jobs/{{jobId}}/proposals`
- **Body**:
```json
{
  "proposal_content": "I would be a great fit for this project...",
  "timeline": "2 weeks",
  "bid": 950.00
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Proposal submitted successfully",
  "proposal": {
    "id": 1,
    "job_id": 1,
    "freelancer_id": 1,
    "proposal_content": "I would be a great fit for this project...",
    "timeline": "2 weeks",
    "bid": 950.00,
    "status": "submitted",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

### Get Proposals for a Job

- **Method**: GET
- **URL**: `{{baseUrl}}/api/jobs/{{jobId}}/proposals`
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "job_id": 1,
    "freelancer_id": 1,
    "proposal_content": "I would be a great fit for this project...",
    "timeline": "2 weeks",
    "bid": 950.00,
    "status": "submitted",
    "created_at": "2023-05-01T12:00:00.000Z",
    "freelancer_email": "test@example.com"
  }
]
```

### Invite Freelancer to Job

- **Method**: POST
- **URL**: `{{baseUrl}}/api/jobs/{{jobId}}/invite`
- **Body**:
```json
{
  "freelancerId": 1
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Invitation sent successfully",
  "invitation": {
    "id": 1,
    "job_id": 1,
    "freelancer_id": 1,
    "status": "pending",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

## Learning Hub

### Get Available Courses

- **Method**: GET
- **URL**: `{{baseUrl}}/api/learning-courses`
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Introduction to Node.js",
    "description": "Learn the basics of Node.js",
    "content_url": "https://example.com/course/nodejs",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
]
```

### Enroll in a Course

- **Method**: POST
- **URL**: `{{baseUrl}}/api/learning-courses/{{courseId}}/enroll`
- **Body**:
```json
{
  "userId": 1
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Enrolled successfully",
  "enrollment": {
    "id": 1,
    "user_id": 1,
    "course_id": 1,
    "enrollment_date": "2023-05-01T12:00:00.000Z",
    "status": "enrolled"
  }
}
```

## Financial & Transactions

### Get Connects Balance

- **Method**: GET
- **URL**: `{{baseUrl}}/api/payments/connects`
- **Expected Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 1,
  "balance": 50,
  "last_updated": "2023-05-01T12:00:00.000Z"
}
```

### Purchase Connects

- **Method**: POST
- **URL**: `{{baseUrl}}/api/payments/connects/purchase`
- **Body**:
```json
{
  "amount": 10,
  "payment_method": "credit_card"
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "Connects purchased successfully",
  "connects": {
    "id": 1,
    "user_id": 1,
    "balance": 60,
    "last_updated": "2023-05-01T12:00:00.000Z"
  },
  "transaction": {
    "id": 1,
    "user_id": 1,
    "transaction_type": "connect_purchase",
    "amount": 10.00,
    "transaction_date": "2023-05-01T12:00:00.000Z"
  }
}
```

### Get Transaction History

- **Method**: GET
- **URL**: `{{baseUrl}}/api/payments/transactions`
- **Query Parameters**:
  - `transaction_type` (optional): Filter by transaction type
  - `startDate` (optional): Filter by start date
  - `endDate` (optional): Filter by end date
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "transaction_type": "connect_purchase",
    "amount": 10.00,
    "transaction_date": "2023-05-01T12:00:00.000Z",
    "details": "Purchase of 10 connects"
  }
]
```

### Process Revenue Share

- **Method**: POST
- **URL**: `{{baseUrl}}/api/payments/revenue-share`
- **Body**:
```json
{
  "jobId": 1,
  "amount": 950.00,
  "platformFee": 47.50
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "Revenue share processed successfully",
  "transactions": [
    {
      "id": 2,
      "user_id": 1,
      "transaction_type": "revenue_share",
      "amount": 902.50,
      "transaction_date": "2023-05-01T12:00:00.000Z",
      "details": "Payment for job #1"
    },
    {
      "id": 3,
      "user_id": "admin",
      "transaction_type": "platform_fee",
      "amount": 47.50,
      "transaction_date": "2023-05-01T12:00:00.000Z",
      "details": "Platform fee for job #1"
    }
  ]
}
```

## Feedback & Reviews

### Submit Feedback

- **Method**: POST
- **URL**: `{{baseUrl}}/api/feedback`
- **Body**:
```json
{
  "jobId": 1,
  "reviewerId": 2,
  "revieweeId": 1,
  "rating": 4.5,
  "comment": "Great work, delivered on time!",
  "role": "client"
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": 1,
    "job_id": 1,
    "reviewer_id": 2,
    "reviewee_id": 1,
    "rating": 4.50,
    "comment": "Great work, delivered on time!",
    "role": "client",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

### Get User Feedback

- **Method**: GET
- **URL**: `{{baseUrl}}/api/feedback/{{userId}}`
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "job_id": 1,
    "reviewer_id": 2,
    "reviewee_id": 1,
    "rating": 4.50,
    "comment": "Great work, delivered on time!",
    "role": "client",
    "created_at": "2023-05-01T12:00:00.000Z",
    "job_title": "Build a RESTful API"
  }
]
```

## Digital Products

### Get All Digital Products

- **Method**: GET
- **URL**: `{{baseUrl}}/api/digital-products`
- **Query Parameters**:
  - `userId` (optional): Filter by freelancer ID
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "freelancer_id": 1,
    "product_name": "React Component Library",
    "description": "A collection of reusable React components",
    "product_url": "https://example.com/product/react-components",
    "price": 49.99,
    "created_at": "2023-05-01T12:00:00.000Z",
    "freelancer_email": "test@example.com",
    "average_rating": 4.25
  }
]
```

### Get Digital Product by ID

- **Method**: GET
- **URL**: `{{baseUrl}}/api/digital-products/{{productId}}`
- **Expected Response** (200 OK):
```json
{
  "product": {
    "id": 1,
    "freelancer_id": 1,
    "product_name": "React Component Library",
    "description": "A collection of reusable React components",
    "product_url": "https://example.com/product/react-components",
    "price": 49.99,
    "created_at": "2023-05-01T12:00:00.000Z",
    "freelancer_email": "test@example.com"
  },
  "reviews": [
    {
      "id": 1,
      "product_id": 1,
      "reviewer_id": 2,
      "rating": 4.50,
      "comment": "Great components, saved me a lot of time!",
      "created_at": "2023-05-01T12:00:00.000Z",
      "reviewer_email": "client@example.com"
    }
  ]
}
```

### Create Digital Product

- **Method**: POST
- **URL**: `{{baseUrl}}/api/digital-products`
- **Body**:
```json
{
  "freelancerId": 1,
  "productName": "React Component Library",
  "description": "A collection of reusable React components",
  "productUrl": "https://example.com/product/react-components",
  "price": 49.99
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Digital product created successfully",
  "product": {
    "id": 1,
    "freelancer_id": 1,
    "product_name": "React Component Library",
    "description": "A collection of reusable React components",
    "product_url": "https://example.com/product/react-components",
    "price": 49.99,
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

### Update Digital Product

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/digital-products/{{productId}}`
- **Body**:
```json
{
  "productName": "Updated React Component Library",
  "price": 59.99
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "Digital product updated successfully",
  "product": {
    "id": 1,
    "freelancer_id": 1,
    "product_name": "Updated React Component Library",
    "description": "A collection of reusable React components",
    "product_url": "https://example.com/product/react-components",
    "price": 59.99,
    "created_at": "2023-05-01T12:00:00.000Z",
    "updated_at": "2023-05-02T12:00:00.000Z"
  }
}
```

### Delete Digital Product

- **Method**: DELETE
- **URL**: `{{baseUrl}}/api/digital-products/{{productId}}`
- **Expected Response** (200 OK):
```json
{
  "message": "Digital product deleted successfully"
}
```

### Submit Product Review

- **Method**: POST
- **URL**: `{{baseUrl}}/api/digital-products/{{productId}}/reviews`
- **Body**:
```json
{
  "reviewerId": 2,
  "rating": 4.5,
  "comment": "Great components, saved me a lot of time!"
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Product review submitted successfully",
  "review": {
    "id": 1,
    "product_id": 1,
    "reviewer_id": 2,
    "rating": 4.50,
    "comment": "Great components, saved me a lot of time!",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

## Balance Management

### Get User Balance

- **Method**: GET
- **URL**: `{{baseUrl}}/api/balances`
- **Query Parameters**:
  - `userId` (optional): User ID, defaults to authenticated user
- **Expected Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 1,
  "available_amount": 902.50,
  "pending_amount": 0.00,
  "last_updated": "2023-05-01T12:00:00.000Z"
}
```

### Add Funds

- **Method**: POST
- **URL**: `{{baseUrl}}/api/balances/add`
- **Body**:
```json
{
  "userId": 1,
  "amount": 100.00
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "Funds added successfully",
  "balance": {
    "id": 1,
    "user_id": 1,
    "available_amount": 1002.50,
    "pending_amount": 0.00,
    "last_updated": "2023-05-02T12:00:00.000Z"
  }
}
```

### Withdraw Funds

- **Method**: POST
- **URL**: `{{baseUrl}}/api/balances/withdraw`
- **Body**:
```json
{
  "userId": 1,
  "amount": 50.00
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "Withdrawal successful",
  "balance": {
    "id": 1,
    "user_id": 1,
    "available_amount": 952.50,
    "pending_amount": 0.00,
    "last_updated": "2023-05-02T12:00:00.000Z"
  }
}
```

## Invitations

### Get Invitations for Freelancer

- **Method**: GET
- **URL**: `{{baseUrl}}/api/invitations`
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "job_id": 1,
    "freelancer_id": 1,
    "status": "pending",
    "created_at": "2023-05-01T12:00:00.000Z",
    "job_title": "Build a RESTful API",
    "job_description": "Need a developer to build a RESTful API",
    "client_id": 2,
    "client_email": "client@example.com"
  }
]
```

### Respond to Invitation

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/invitations/{{invitationId}}/respond`
- **Body**:
```json
{
  "status": "accepted" // or "declined"
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "Invitation accepted successfully",
  "invitation": {
    "id": 1,
    "job_id": 1,
    "freelancer_id": 1,
    "status": "accepted",
    "created_at": "2023-05-01T12:00:00.000Z"
  }
}
```

## Work History

### Get User Work History

- **Method**: GET
- **URL**: `{{baseUrl}}/api/work-history/{{userId}}`
- **Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "company_name": "Google",
    "position": "Software Engineer",
    "start_date": "2020-01-01",
    "end_date": "2022-12-31",
    "description": "Worked on various projects using JavaScript and Node.js",
    "is_current": false,
    "created_at": "2023-05-01T12:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "company_name": "Meta",
    "position": "Senior Developer",
    "start_date": "2023-01-01",
    "end_date": null,
    "description": "Working on React applications",
    "is_current": true,
    "created_at": "2023-05-01T12:00:00.000Z"
  }
]
```

### Create Work History Entry

- **Method**: POST
- **URL**: `{{baseUrl}}/api/work-history`
- **Body**:
```json
{
  "userId": 1,
  "companyName": "Microsoft",
  "position": "Frontend Developer",
  "startDate": "2018-01-01",
  "endDate": "2019-12-31",
  "description": "Worked on UI components",
  "isCurrent": false
}
```
- **Expected Response** (201 Created):
```json
{
  "message": "Work history entry created successfully",
  "entry": {
    "id": 3,
    "user_id": 1,
    "company_name": "Microsoft",
    "position": "Frontend Developer",
    "start_date": "2018-01-01",
    "end_date": "2019-12-31",
    "description": "Worked on UI components",
    "is_current": false,
    "created_at": "2023-05-02T12:00:00.000Z"
  }
}
```

### Update Work History Entry

- **Method**: PUT
- **URL**: `{{baseUrl}}/api/work-history/{{entryId}}`
- **Body**:
```json
{
  "position": "Senior Frontend Developer",
  "description": "Worked on UI components and team leadership"
}
```
- **Expected Response** (200 OK):
```json
{
  "message": "Work history entry updated successfully",
  "entry": {
    "id": 3,
    "user_id": 1,
    "company_name": "Microsoft",
    "position": "Senior Frontend Developer",
    "start_date": "2018-01-01",
    "end_date": "2019-12-31",
    "description": "Worked on UI components and team leadership",
    "is_current": false,
    "created_at": "2023-05-02T12:00:00.000Z"
  }
}
```

### Delete Work History Entry

- **Method**: DELETE
- **URL**: `{{baseUrl}}/api/work-history/{{entryId}}`
- **Expected Response** (200 OK):
```json
{
  "message": "Work history entry deleted successfully"
}
``` 


1. Get User by ID
Method: POST
URL: http://localhost:5000/api/getUserId
Headers:
{
  "email": "i221213@nu.edu.pk"
}

Response:
{
    "userId": 17
}

Authorization: Bearer <your_token> (if authentication is required)

Example Request:

http
Copy
Edit
GET {{baseUrl}}/api/users/123
Expected Response (200 OK):

json
Copy
Edit
{
  "id": 123,
  "name": "John Doe",
  "email": "johndoe@example.com",
  "role": "client",
  "created_at": "2023-05-01T12:00:00.000Z",
  "updated_at": "2023-05-10T15:30:00.000Z"
}



------------------------------------------------------------------------------------------------------


✅ 1. Get All Categories
Endpoint: GET /getAllCategories

Description: Fetch all job categories with their id and name.

🔸 Request:
Method: GET

URL: http://localhost:5000/api/categories/getAllCategories

🔸 Response:
json
Copy
Edit
[
  {
    "id": 1,
    "name": "Web Development"
  },
  {
    "id": 2,
    "name": "Graphic Design"
  }
]


✅ 2. Get Category ID by Name
Endpoint: POST /getCategoryIdByName

Description: Retrieve the id of a category using its name.

🔸 Request:
Method: POST

URL: http://localhost:5000/api/categories/getCategoryIdByName

Body (JSON):

json
Copy
Edit
{
  "name": "Web Development"
}
🔸 Response:
json
Copy
Edit
{
  "id": 1
}
🔸 Error Response:
json
Copy
Edit
{
  "error": "Category not found"
}
✅ 3. Get Category Name by ID
Endpoint: POST /getCategoryNameById

Description: Retrieve the name of a category using its id.

🔸 Request:
Method: POST

URL: http://localhost:5000/api/categories/getCategoryNameById

Body (JSON):

json
Copy
Edit
{
  "id": 1
}
🔸 Response:
json
Copy
Edit
{
  "name": "Web Development"
}
🔸 Error Response:
json
Copy
Edit
{
  "error": "Category not found"
}