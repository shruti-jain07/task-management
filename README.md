# Task & Workflow Management System

## Overview
A backend-focused Task & Workflow Management System designed for organizations to manage users, teams, and tasks with strict role-based access control and data isolation.

The system ensures that each organization operates independently, and all actions are restricted based on user roles and permissions.

## Features

### Authentication & Authorization
- JWT-based authentication (access & refresh tokens)
- Role-Based Access Control (RBAC)
- Middleware-based route protection

### Organization-Level Isolation
- Each user belongs to a single organization
- All data is scoped by organization
- Cross-organization access is restricted

### Team Management
- Create and manage teams within an organization
- Assign users to teams
- Team-level task handling

### Task Management
- Create, assign, and update tasks
- Task attributes:
  - Title
  - Description
  - Priority
  - Due Date
- Task workflow:
  - TODO → IN_PROGRESS → DONE

### Permission Control
- **Admin**
  - Full access to organization data
  - Full access to perform any action
- **Manager**
  - Manage tasks within their team
- **User**
  - View their own tasks only

### API Capabilities
- Pagination for large datasets
- Input validation
- Centralized error handling

### Audit Logging
- Tracks important actions like:
  - Task creation
  - Team Creation
  - Team status update

---

## Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MySQL  
- **Authentication:** JWT  
- **API Testing:** Thunder Client  

---

## System Design

### Structure
The system follows a layered architecture:
- Routes → Controllers → Services → Database

### Core Components
- **Organization** – Data isolation boundary  
- **Users & Roles** – Access control  
- **Teams** – Grouping mechanism  
- **Tasks** – Core workflow entity  

---

## Database Schema

### Core Tables
- `organizations`
- `users`
- `roles`
- `teams`
- `tasks`

### Supporting Tables
- `refresh_tokens`
- `token_blacklist`
- `audit_logs`

---

##  API Endpoints

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Tasks
//create task
- `POST /teams/:teamId/tasks`
//List Tasks
- `GET /teams/:teamId/tasks`
//Update Task status(ACTIVE/INACTIVE)
- `PATCH /teams/:teamId/tasks/:taskId/status`
//delete task
- `DELETE /:teamId/tasks/:taskId`
### Teams

//Create Team
- `POST /teams/`
//List Teams
- `GET /teams/`
//Get team by id
- `GET /teams/:id`
//Update team name
- `PATCH /teams/:id`
//Update Team Status
-`PATCH /teams/:id/status`

### users
//Get current user
-`GET /users/me`
//List all users
-`GET /users/`
//Update user status
-`PATCH /users/:id/status`

---

## Design Considerations
- All queries are scoped using `organization_id`
- Backend enforces authorization checks
- Data consistency maintained using transactions
- Soft delete strategy used for user management

---

## Learning Outcomes
- Designed scalable backend architecture
- Implemented RBAC and secure authentication
- Built REST APIs with validation and error handling
- Worked with relational database design and constraints

---

## Author
Shruti Jain
