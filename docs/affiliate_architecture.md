# MASTER DOCUMENTATION UPDATE
## Affiliate Teacher + Affiliate Student Modules
**(Owner-First Payment Architecture Compatible)**

This document extends your system with:
1. Affiliate Teacher Module (Institute Only)
2. Affiliate Student Module (Institute Students Only)
3. Owner Panel Controls
4. Wallet + Commission + Reward Logic
5. Withdrawal Rules

All flows follow the **Owner First Payment Model**.

### 1. Affiliate Teacher Module
**Scope**
- Works ONLY with: Institute Tenant
- Not allowed for: School, Independent Teacher

### 2. Affiliate Teacher Structure
Institute
↓
Affiliate Teachers
↓
Referred Exams
↓
Students purchase
↓
Owner receives payment
↓
Reward credited to Affiliate Teacher Wallet

### 3. Affiliate Teacher Permissions
**Affiliate Teacher Can:**
- Refer Exams
- Share exam links
- Refer new affiliate teachers
- View earnings
- Withdraw rewards
- View reports

**Affiliate Teacher Cannot:**
- Create exams
- Manage institute
- Access students
- Edit pricing

### 4. Affiliate Teacher Onboarding Flow
Institute Panel
↓
Create Affiliate Teacher
↓
Enter details
**Fields:** Name, Mobile, Email, Address, PAN, Aadhar, Bank Account, IFSC, UPI (optional)
↓
**KYC Upload:** PAN card, Aadhar card, Bank proof
↓
Submit
↓
Institute Approval
↓
Affiliate Activated

### 5. Affiliate Teacher Referral Flow
Affiliate Teacher
↓
Get referral link
↓
Share exam
↓
Student opens link
↓
Student pays exam fee
↓
Owner receives payment
↓
Reward calculated
↓
Affiliate teacher wallet credited

### 6. Affiliate Teacher Reward Rules
**Reward Types:**
- Flat amount
- Percentage
- Per exam reward

**Example:**
Exam fee = ₹100
Affiliate reward = 20%
Affiliate gets = ₹20
Tenant gets commission
Owner keeps remaining

### 7. Affiliate Teacher Wallet
**Wallet Types:**
- Reward wallet
- Withdrawable wallet

**Affiliate can:**
- Withdraw
- View history
- Request payout

### 8. Affiliate Teacher Withdrawal Flow
Affiliate wallet balance
↓
Request withdrawal
↓
Apply TDS
↓
Admin approval
↓
Bank transfer
↓
Mark paid

### 9. Affiliate Teacher Refers Affiliate Teacher
**Multi-level referral allowed (Optional)**
**Flow:**
- Affiliate A refers Affiliate B
- Affiliate B sells exam
- Affiliate B gets reward
- Affiliate A gets override reward

**Example:**
Level 1 = 20%
Level 2 = 5%

### 10. Affiliate Teacher Commission Flow
Student pays ₹100
**Distribution example:**
- Owner receives = ₹100
- Tenant commission = ₹60
- Affiliate reward = ₹20
- Owner profit = ₹20

### 11. Affiliate Student Module
**Works only with:** Institute Students
**Not allowed:** School students, Independent teacher students

### 12. Affiliate Student Permissions
**Affiliate Student Can:**
- Refer exams
- Share links
- Earn credits

**Affiliate Student Cannot:**
- Withdraw money
- Convert to cash
- Transfer credits

### 13. Affiliate Student Reward Flow
Affiliate Student
↓
Share exam link
↓
User pays exam fee
↓
Owner receives payment
↓
Reward calculated
↓
Credits added to student wallet

### 14. Affiliate Student Reward Example
Exam fee = ₹100
Affiliate student reward = 10 credits
Student wallet credited = 10
*Not withdrawable*

### 15. Affiliate Student Wallet Rules
**Credits added as:** Affiliate credits
- Cannot withdraw
- Cannot transfer
- Only usable for exams

**Wallet Structure:**
- free_credits
- paid_credits
- affiliate_credits

**Usage priority:** affiliate credits -> free credits -> paid credits

### 16. Owner First Payment Flow (Affiliate Included)
User pays exam fee
↓
Owner receives payment
↓
Commission engine runs
↓
Tenant commission calculated
↓
Affiliate reward calculated
↓
Wallet credits distributed

### 17. Owner Panel — Affiliate Settings
**Affiliate Teacher Settings**
- Enable affiliate teacher
- Reward type
- Reward %
- Flat reward option
- Multi level toggle
- Level 2 reward
- Minimum withdrawal
- TDS %

**Affiliate Student Settings**
- Enable affiliate student
- Reward credits
- Per exam reward
- Max reward limit
- Credit expiry
- Usage restriction

### 18. Institute Panel Controls
**Institute can:**
- Enable affiliate teachers
- Approve KYC
- View affiliate performance
- Set exam specific reward
- Disable affiliate

### 19. Reports
**Affiliate Teacher Report**
- Affiliate Name, Exams referred, Sales, Reward earned, Withdrawn, Pending
**Affiliate Student Report**
- Student, Exams referred, Credits earned, Credits used, Balance

### 20. Database Tables
**Affiliate Teachers**
id, tenant_id, name, mobile, email, kyc_status, bank_details, status

**Affiliate Students**
id, student_id, tenant_id, status

**Affiliate Transactions**
id, affiliate_id, type (teacher/student), exam_id, amount, reward, status, date

**Affiliate Wallet**
id, affiliate_id, balance, withdrawable

### 21. Full Payment Distribution Example
Exam fee = ₹100
**Distribution:**
- Owner receives = ₹100
- Tenant commission = ₹60
- Affiliate teacher reward = ₹20
- Affiliate student reward = 10 credits
- Owner profit = ₹20

Final Architecture Result
- Affiliate Teacher module (Institute only)
- Affiliate Student module (Institute students only)
- Owner first payment maintained
- Affiliate wallet with withdrawal
- Student affiliate credits only
- Multi-level referral support
- KYC approval system
- Owner controlled reward system
- Fully integrated finance module
