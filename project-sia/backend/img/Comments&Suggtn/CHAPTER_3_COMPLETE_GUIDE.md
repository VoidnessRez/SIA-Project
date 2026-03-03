# CHAPTER 3: RESEARCH METHODOLOGY
## Complete Guide for SIAA 311 Thesis Documentation

---

## 📋 CHAPTER 3 OVERVIEW

Chapter 3 outlines the research methods, tools, and procedures used in developing your Online Ordering Inventory Management System with Digital Receipt Acknowledgement via Email for Mejia Spare Parts and Accessories.

---

## 1. POPULATION AND SAMPLING

### 1.1 Research Locale
**Location:** Mejia Spare Parts and Accessories, Antipolo City, Rizal, Philippines

**Business Profile:**
- Type: Motorcycle spare parts and accessories retail
- Primary customers: Individual motorcycle owners, repair shops, and small dealerships
- Service area: Antipolo City and nearby municipalities (Rizal province, parts of Metro Manila)

### 1.2 Population
**Target Population:** The study focuses on two primary user groups:

#### A. Customers (End Users)
- **Total Population:** Approximately 200-300 regular customers per month
- **Characteristics:**
  - Age range: 18-60 years old
  - Motorcycle owners requiring spare parts and accessories
  - Varying technical knowledge levels
  - Access to internet and email

#### B. Business Staff (System Administrators)
- **Total Population:** 3-5 staff members
- **Roles:**
  - Store owner/manager (1)
  - Sales staff (2-3)
  - Inventory clerk (1)

### 1.3 Sampling Method
**Type:** Purposive Sampling (Non-probability sampling)

**Sample Size:**
- **Customer respondents:** 50-100 customers
- **Staff respondents:** All staff members (3-5 persons)

**Inclusion Criteria:**
- Customers: Active customers who have purchased within the last 6 months
- Staff: Currently employed and involved in inventory or sales operations
- All participants: Willing to test the system and provide feedback

**Rationale:** Purposive sampling ensures that respondents have relevant experience with the current business process and can provide meaningful insights for system evaluation.

---

## 2. DATA GATHERING TOOLS

### 2.1 Survey Questionnaire
**Purpose:** Assess user satisfaction, system usability, and feature effectiveness

**Sections:**
1. **Demographic Information**
   - Age, occupation, frequency of purchases

2. **System Usability (5-point Likert Scale)**
   - Navigation ease
   - Interface design
   - Search functionality
   - Checkout process

3. **Feature Evaluation**
   - Product browsing and filtering
   - Shopping cart management
   - Online ordering process
   - Digital receipt via email
   - Order tracking

4. **Inventory Management (Admin/Staff only)**
   - Stock monitoring accuracy
   - Low stock alerts effectiveness
   - Overstock monitoring
   - Price history tracking
   - Wholesale discount calculation

5. **Open-ended Questions**
   - Suggestions for improvement
   - Encountered difficulties
   - Most useful features

### 2.2 System Testing
**Types:**
1. **Functional Testing**
   - Test all features work as intended
   - Verify data accuracy
   - Check email delivery system

2. **Usability Testing**
   - Observe users completing tasks
   - Measure task completion time
   - Record error rates

3. **Performance Testing**
   - Measure page load times
   - Test system under multiple concurrent users
   - Database query performance

### 2.3 Interview Guide (Semi-structured)
**For:** Store owner and key staff members

**Topics:**
- Current inventory management challenges
- Order processing pain points
- Expected system benefits
- Integration with existing processes

### 2.4 System Logs and Analytics
**Data Collected:**
- Number of orders processed
- Average order processing time
- Most viewed/purchased products
- Error logs and system issues
- Email delivery success rate

---

## 3. DATA ANALYSIS PROCEDURE

### 3.1 Quantitative Data Analysis

#### A. Descriptive Statistics
**Applied to:** Survey responses (Likert scale data)

**Statistical Measures:**
- **Mean (μ):** Average rating for each feature/criterion
  ```
  μ = Σx / n
  Where: x = individual scores, n = number of respondents
  ```

- **Standard Deviation (σ):** Measure of data variability
  ```
  σ = √[Σ(x - μ)² / n]
  ```

- **Frequency Distribution:** Count and percentage of responses per category

**Interpretation Scale:**
| Range | Interpretation |
|-------|----------------|
| 4.21 - 5.00 | Strongly Agree / Excellent |
| 3.41 - 4.20 | Agree / Very Good |
| 2.61 - 3.40 | Neutral / Good |
| 1.81 - 2.60 | Disagree / Fair |
| 1.00 - 1.80 | Strongly Disagree / Poor |

#### B. Performance Metrics Analysis
**System Performance Indicators:**
- Average response time (milliseconds)
- Order completion rate (percentage)
- Error rate (errors per 100 transactions)
- Email delivery success rate (percentage)

### 3.2 Qualitative Data Analysis

#### A. Thematic Analysis
**Process:**
1. **Familiarization:** Read all open-ended responses
2. **Coding:** Identify recurring themes and patterns
3. **Theme Development:** Group related codes into themes
4. **Review:** Verify themes accurately represent data
5. **Reporting:** Present themes with supporting quotes

**Common Themes Expected:**
- Ease of use
- Time savings
- Accuracy improvements
- Feature requests
- Technical difficulties

#### B. Content Analysis
**Applied to:** Interview transcripts and system logs

**Categories:**
- Functional issues
- Usability concerns
- Business process improvements
- System stability

---

## 4. STATISTICAL TREATMENT/TOOLS

### 4.1 Statistical Software
**Tools Used:**
- **Microsoft Excel:** For basic statistical calculations and charts
- **Google Forms:** For survey distribution and initial data collection
- **SPSS (Optional):** For advanced statistical analysis if needed

### 4.2 Statistical Tests

#### A. ISO 25010 Software Quality Model
**Quality Characteristics Evaluated:**

1. **Functional Suitability**
   - Completeness: System provides all required functions
   - Correctness: System produces accurate results
   - Appropriateness: Functions are suitable for tasks

2. **Performance Efficiency**
   - Time behavior: Response and processing time
   - Resource utilization: Memory and bandwidth usage

3. **Usability**
   - Learnability: Easy to learn
   - Operability: Easy to operate and control
   - User interface aesthetics: Pleasing UI

4. **Reliability**
   - Maturity: System stability
   - Availability: System uptime
   - Fault tolerance: Ability to handle errors

5. **Security**
   - Confidentiality: Data protection
   - Integrity: Prevention of unauthorized modification
   - Authentication: User verification (OTP for admin)

**Rating Scale:** Same as survey (1-5 Likert scale)

#### B. Weighted Mean Formula
```
Weighted Mean (WM) = Σ(w × x) / Σw

Where:
w = weight assigned to each criterion
x = rating score
```

#### C. Percentage Formula
```
Percentage = (Part / Whole) × 100%
```

**Used for:**
- Response rates
- Feature adoption rates
- Success/failure rates

---

## 5. RESEARCH INSTRUMENTS

### 5.1 System Development Tools
**Frontend:**
- React.js (v18+)
- Vite (Build tool)
- React Router (Navigation)
- CSS3 (Styling)

**Backend:**
- Node.js with Express.js
- Supabase (Database: PostgreSQL)
- Nodemailer (Email service)

**Development Environment:**
- Visual Studio Code
- Git & GitHub (Version control)
- Postman (API testing)

### 5.2 Testing Instruments
**Hardware:**
- Desktop computers (Windows/Mac)
- Mobile devices (Android/iOS) for responsive testing
- Various screen sizes for compatibility testing

**Software:**
- Chrome DevTools (Performance monitoring)
- Browser compatibility testing (Chrome, Firefox, Edge)
- Network throttling tools (Testing under slow connections)

---

## 6. ETHICAL CONSIDERATIONS

### 6.1 Informed Consent
- All participants will be informed about the study's purpose
- Participation is voluntary
- Participants can withdraw anytime

### 6.2 Data Privacy
- Compliance with Data Privacy Act of 2012 (RA 10173)
- User data encrypted and securely stored
- No personal information shared without consent
- Email addresses used only for system functionality

### 6.3 Confidentiality
- Survey responses anonymous
- Business data handled confidentially
- System access restricted to authorized users only

### 6.4 Security Measures Implemented
- Admin authentication with OTP verification
- Password hashing and encryption
- Secure database connections (HTTPS/SSL)
- Regular security audits

---

## 7. SYSTEM EVALUATION CRITERIA

### 7.1 Functionality Testing Checklist

#### Customer Features:
- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Shopping cart management
- [ ] Checkout process (pickup/delivery)
- [ ] Digital receipt via email
- [ ] Order history tracking
- [ ] Wholesale discount calculation
- [ ] Profile management

#### Admin Features:
- [ ] Inventory management (spare parts & accessories)
- [ ] Stock level monitoring (low stock alerts)
- [ ] Overstock monitoring and alerts
- [ ] Price history tracking
- [ ] Stock release management
- [ ] Incoming/outgoing stock view
- [ ] Order approval system
- [ ] Sales reports and analytics

### 7.2 Success Metrics

**Quantitative:**
- 80%+ user satisfaction rating
- <3 seconds average page load time
- 95%+ email delivery success rate
- <5% error rate

**Qualitative:**
- Positive user feedback
- Improved inventory accuracy
- Streamlined order processing
- Better business insights

---

## 8. DATA COLLECTION TIMELINE

| Phase | Activity | Duration | Timeline |
|-------|----------|----------|----------|
| 1 | System Development | 8-10 weeks | Sept-Nov 2025 |
| 2 | Internal Testing | 2 weeks | Dec 2025 |
| 3 | User Training | 1 week | Jan 2026 |
| 4 | Pilot Testing | 2 weeks | Jan 2026 |
| 5 | Survey Distribution | 2 weeks | Feb 2026 |
| 6 | Data Collection | 2 weeks | Feb 2026 |
| 7 | Data Analysis | 2 weeks | Feb-Mar 2026 |
| 8 | Report Writing | 2 weeks | Mar 2026 |

---

## 9. VALIDITY AND RELIABILITY

### 9.1 Instrument Validity
- Survey validated by thesis adviser
- Pilot tested with small group
- Questions aligned with research objectives

### 9.2 System Reliability
- Consistent results across multiple tests
- Stable performance under normal load
- Accurate data processing and storage

### 9.3 Triangulation
Multiple data sources used:
- Quantitative surveys
- Qualitative interviews
- System testing results
- Usage analytics

---

## 10. LIMITATIONS OF THE STUDY

### 10.1 Scope Limitations
- Limited to Mejia Spare Parts and Accessories only
- Does not include payment gateway integration (COD, GCash, Bank Transfer only)
- No mobile application (web-based only, mobile-responsive)

### 10.2 Sample Limitations
- Limited to active customers and current staff
- Sample may not represent all potential users
- Purposive sampling (non-probability)

### 10.3 Technical Limitations
- Requires internet connection
- Email delivery depends on third-party service
- Limited to modern web browsers

---

## 📌 PANEL RECOMMENDATIONS IMPLEMENTED

Based on your defense panel suggestions:

✅ **1. Removed TAX from receipts**
   - No longer displaying 12% VAT (as per panel: "Remove the tax on receipts")

✅ **2. Kept OTP Verification for Admin Panel**
   - Enhanced security for inventory management access

✅ **3. Implemented Panel Suggestions:**
   - ✅ Price History Module (track market price changes)
   - ✅ Wholesale Discounts (tiered bulk order discounts)
   - ✅ Overstock Monitoring and Alerts
   - ✅ Stock Release Feature
   - ✅ Incoming/Outgoing Stock View

✅ **4. Order History**
   - Complete order tracking for customers

✅ **5. Stock Report (Minimum/Maximum)**
   - Low stock alerts (minimum levels)
   - Overstock alerts (maximum levels)

---

## 💡 TIPS FOR PRESENTATION

### What to Emphasize:
1. **Systematic Approach:** Clearly defined methodology
2. **Multiple Data Sources:** Quantitative + Qualitative
3. **Ethical Compliance:** Data privacy and security
4. **Practical Implementation:** Real business application
5. **Panel Alignment:** Addressed all recommendations

### Common Panel Questions:
- **Q: Why purposive sampling?**
  - A: Need respondents with relevant experience with current system and willingness to test new system

- **Q: How will you ensure data validity?**
  - A: Multiple validation methods: adviser review, pilot testing, triangulation

- **Q: What if email service fails?**
  - A: System will retry delivery, alternative: downloadable PDF receipt

- **Q: How is this different from existing systems?**
  - A: Tailored for motorcycle spare parts business, includes wholesale discounts, comprehensive stock management

---

## 📚 REFERENCES (Sample Format)

### Books:
Creswell, J. W. (2014). *Research Design: Qualitative, Quantitative, and Mixed Methods Approaches* (4th ed.). Sage Publications.

### Online References:
ISO. (2011). ISO/IEC 25010:2011 Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE). Retrieved from https://www.iso.org/standard/35733.html

---

**Good luck with your defense, BESHYYY! 🎉**

All features requested are now implemented. Proceed with documenting and testing! 🚀
