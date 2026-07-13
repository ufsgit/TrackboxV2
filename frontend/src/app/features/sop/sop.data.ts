export interface SopSection {
  id: string;
  title: string;
  content: string; // HTML content
  subSections?: SopSection[];
}

export const SOP_DATA: Record<string, SopSection[]> = {
  'leads': [
    {
      id: 'leads-overview',
      title: '1. Lead Module Overview & Objective',
      content: `
        <p>The <strong>Leads Module</strong> acts as the central hub for capturing, nurturing, and qualifying prospects before they are moved into the core CRM pipeline. The primary objective is to ensure zero lead leakage and maximize the conversion rate of marketing efforts.</p>
        <p><strong>Key Metrics Tracked:</strong></p>
        <ul>
          <li>Total Leads Generated (Daily/Weekly/Monthly)</li>
          <li>Lead Response Time (SLA: Under 15 minutes)</li>
          <li>Lead Conversion Rate</li>
          <li>Source Performance (WhatsApp, SMS, Referrals)</li>
        </ul>
        <p>Start your day at <span class="route-badge">/lead-dashboard</span> to view these critical metrics and prioritize tasks.</p>
      `
    },
    {
      id: 'leads-management',
      title: '2. Lead Capture & Management Workflow',
      content: `
        <p>Leads enter the system through various automated and manual channels. Following the correct workflow ensures they are properly engaged.</p>
        <ol>
          <li><strong>Lead Creation:</strong> Leads are automatically created via Chatbots, Drip campaigns, or Click-to-WhatsApp (CTWA) ads. Manual entry can be done via <span class="route-badge">/contacts</span>.</li>
          <li><strong>Initial Qualification:</strong> Sales Development Representatives (SDRs) use the <span class="route-badge">/inbox</span> to chat with leads in real-time. The goal is to determine budget, authority, need, and timeline (BANT).</li>
          <li><strong>Status Updates:</strong> As conversations progress, the lead status MUST be updated in the system (e.g., 'New', 'Engaged', 'Qualified', 'Unqualified'). This is monitored via the <span class="route-badge">/reports/status</span> page.</li>
          <li><strong>Hand-off to CRM:</strong> Once a lead is 'Qualified', they are transitioned to the CRM module for formal quotation and pipeline management.</li>
        </ol>
      `
    },
    {
      id: 'leads-communication',
      title: '3. Marketing & Outreach Automations',
      content: `
        <p>Consistent communication is vital for nurturing cold leads. The system provides powerful automation tools to scale outreach.</p>
        <ul>
          <li><strong>Broadcast Campaigns:</strong> Use <span class="route-badge">/broadcasts</span> to send targeted announcements to specific segments (e.g., 'Holiday Discount Offer'). Ensure you are using approved templates from <span class="route-badge">/templates</span> to avoid spam penalties.</li>
          <li><strong>Drip Sequences:</strong> Configure automated follow-ups at <span class="route-badge">/drip</span>. A standard sequence includes: Day 1 (Welcome), Day 3 (Value Proposition), Day 7 (Special Offer).</li>
          <li><strong>SMS & RCS Integration:</strong> Reach users outside of WhatsApp using standard SMS (<span class="route-badge">/sms</span>) or Rich Communication Services (<span class="route-badge">/rcs</span>) for interactive media messages.</li>
          <li><strong>Chatbots:</strong> Set up FAQ and routing logic at <span class="route-badge">/chatbots</span>. Bots handle out-of-hours inquiries and qualify basic intent before routing to a human SDR.</li>
        </ul>
      `
    },
    {
      id: 'leads-reporting',
      title: '4. Lead Analytics & Auditing',
      content: `
        <p>Continuous monitoring ensures the team hits their KPIs. Managers should review these reports daily and weekly.</p>
        <ul>
          <li><strong>Work Report:</strong> Visit <span class="route-badge">/reports/work</span> to audit the number of actions (messages sent, calls made) performed by each SDR daily.</li>
          <li><strong>Conversation Report:</strong> Access <span class="route-badge">/reports/conversation</span> to analyze average response times and resolution rates.</li>
          <li><strong>Employee Report:</strong> <span class="route-badge">/reports/employee</span> provides a breakdown of individual SDR performance against their targets.</li>
          <li><strong>Enquiry & Status:</strong> Use <span class="route-badge">/reports/enquiry</span> and <span class="route-badge">/reports/status</span> to find bottlenecks in the funnel (e.g., high drop-off at the 'Engaged' stage).</li>
        </ul>
      `
    }
  ],
  'crm': [
    {
      id: 'crm-overview',
      title: '1. CRM & Sales Strategy Overview',
      content: `
        <p>The <strong>CRM Module</strong> is the financial engine of the company. It manages qualified leads, handles complex transactions (Quotes and POs), and drives sales performance.</p>
        <p>The overarching strategy is to move deals through the pipeline as efficiently as possible while maintaining a high win-rate and maximum deal value.</p>
        <ul>
          <li><strong>Dashboard Navigation:</strong> Access <span class="route-badge">/crm-dashboard</span> for a top-down view of the current sales pipeline, expected revenue, and upcoming closing dates.</li>
          <li><strong>Contact Management:</strong> Detailed interaction history, notes, and file attachments for all active clients are centralized at <span class="route-badge">/contacts</span>.</li>
        </ul>
      `
    },
    {
      id: 'crm-daily-ops',
      title: '2. Daily Sales Operations',
      content: `
        <p>Account Executives (AEs) must follow a disciplined daily routine to ensure no deals slip through the cracks.</p>
        <ol>
          <li><strong>Morning Review:</strong> Start the day by checking <span class="route-badge">/todays-leads</span> for any new qualified prospects assigned to you.</li>
          <li><strong>Follow-ups:</strong> Check <span class="route-badge">/pending-followup</span>. Any task that is overdue must be actioned before lunch.</li>
          <li><strong>Client Meetings & Calls:</strong> Log all meeting notes directly into the contact's profile immediately after the interaction.</li>
        </ol>
      `
    },
    {
      id: 'crm-transactions',
      title: '3. Quotations, POs, and Delivery',
      content: `
        <p>The financial workflow must be strictly adhered to for auditing and fulfillment purposes.</p>
        <ul>
          <li><strong>Generating Quotations:</strong> Use <span class="route-badge">/quotations</span> to build customized price quotes. Ensure all discounts are within your approved matrix. Once generated, send the PDF directly to the client through the platform.</li>
          <li><strong>Purchase Orders (POs):</strong> Once a client accepts a quote, convert it immediately to a PO at <span class="route-badge">/purchase-orders</span>. This triggers the billing and fulfillment departments.</li>
          <li><strong>Delivery Management:</strong> Coordinate with logistics via <span class="route-badge">/delivery-management</span>. Track shipping statuses and ensure the client receives their product on schedule. Update the status to 'Delivered' to close the sales loop.</li>
        </ul>
      `
    },
    {
      id: 'crm-performance',
      title: '4. Sales Performance & Gamification',
      content: `
        <p>We believe in a transparent, competitive, and highly rewarding sales culture.</p>
        <ul>
          <li><strong>Targets & Achievements:</strong> Individual and team revenue goals are tracked in real-time at <span class="route-badge">/targets</span> and <span class="route-badge">/achievements</span>.</li>
          <li><strong>Leaderboard:</strong> The <span class="route-badge">/leaderboard</span> publicly ranks sales reps based on revenue generated. It resets monthly.</li>
          <li><strong>Incentives:</strong> Commission structures and bonus payouts are automatically calculated and viewable at <span class="route-badge">/incentives</span>.</li>
          <li><strong>Coaching:</strong> Managers use the <span class="route-badge">/underperformers</span> list to identify reps who need additional coaching or pipeline reviews.</li>
        </ul>
      `
    },
    {
      id: 'crm-analytics',
      title: '5. Sales Analytics & Reporting',
      content: `
        <p>Data-driven decisions require consistent review of our core reports.</p>
        <ul>
          <li><strong>Sales Funnel Report:</strong> Use <span class="route-badge">/sales-funnel-report</span> to identify at which stage we are losing the most deals.</li>
          <li><strong>Lead Conversion:</strong> <span class="route-badge">/lead-conversion-report</span> tracks the ratio of prospects that become paying customers.</li>
          <li><strong>Won/Lost Analysis:</strong> <span class="route-badge">/won-lost-report</span> is critical for understanding market competition. Always log the 'Reason for Loss' when marking a deal as closed-lost.</li>
          <li><strong>Salesperson Report:</strong> <span class="route-badge">/salesperson-report</span> gives a deep dive into individual AE metrics (average deal size, sales cycle length).</li>
        </ul>
      `
    }
  ],
  'operation': [
    {
      id: 'ops-overview',
      title: '1. Operations & Service Overview',
      content: `
        <p>The <strong>Operations Module</strong> handles the entire post-sale lifecycle. This includes physical installations, ongoing maintenance, warranty claims, and customer support.</p>
        <p>The primary objective is to deliver on the promises made by the sales team quickly and flawlessly, ensuring high customer satisfaction (CSAT) and Net Promoter Scores (NPS).</p>
        <ul>
          <li><strong>Operations Dashboard:</strong> Access <span class="route-badge">/operation-dashboard</span> to monitor today's scheduled installations, critical unresolved complaints, and technician utilization rates.</li>
        </ul>
      `
    },
    {
      id: 'ops-field',
      title: '2. Installation & Field Operations',
      content: `
        <p>Field technicians represent the face of the company post-sale. Strict adherence to SOPs is required.</p>
        <ol>
          <li><strong>Scheduling:</strong> Dispatchers use <span class="route-badge">/installation</span> to assign jobs based on technician availability and geographic proximity.</li>
          <li><strong>On-Site Execution:</strong> Technicians must check in on the mobile view upon arrival. They must take before-and-after photos and upload them to the job ticket.</li>
          <li><strong>Completion & Sign-off:</strong> Upon finishing the installation, the technician must get a digital signature from the client and mark the job as 'Completed' in the system.</li>
        </ol>
      `
    },
    {
      id: 'ops-support',
      title: '3. Customer Support & Complaints',
      content: `
        <p>Swift resolution of issues prevents churn and negative reviews.</p>
        <ul>
          <li><strong>Complaint Logging:</strong> All incoming issues must be logged immediately at <span class="route-badge">/complaints</span>. SLA dictates that all critical complaints must be acknowledged within 2 hours.</li>
          <li><strong>Resolution Workflow:</strong> Complaints are categorized (Tier 1 Support, Tier 2 Tech, Field Visit Required). The status must be updated at every touchpoint.</li>
          <li><strong>Warranty Service:</strong> Verify the client's warranty status at <span class="route-badge">/warranty-service</span> before dispatching free repairs. Log all parts used during warranty maintenance.</li>
          <li><strong>Customer Feedback:</strong> Post-resolution, automated NPS surveys are sent. Review the results at <span class="route-badge">/customer-feedback</span> and reach out directly to detractors (score 0-6).</li>
        </ul>
      `
    },
    {
      id: 'ops-reporting',
      title: '4. Operational Analytics',
      content: `
        <p>Managers must track efficiency and quality through the following reports:</p>
        <ul>
          <li><strong>Installation Report:</strong> <span class="route-badge">/installation-report</span> tracks average installation time and first-time-right percentages.</li>
          <li><strong>Technician Report:</strong> <span class="route-badge">/technician-report</span> monitors individual technician productivity, travel time, and customer feedback scores.</li>
          <li><strong>Complaint & Warranty Reports:</strong> Use <span class="route-badge">/complaint-report</span> and <span class="route-badge">/warranty-report</span> to identify recurring product defects or systemic issues that need to be escalated to manufacturing/engineering.</li>
        </ul>
      `
    }
  ],
  'hr': [
    {
      id: 'hr-overview',
      title: '1. Human Resources Strategy Overview',
      content: `
        <p>The <strong>HR Module</strong> is dedicated to workforce management, ensuring compliance, tracking performance, and managing employee well-being.</p>
        <ul>
          <li><strong>HR Dashboard:</strong> Start at the <span class="route-badge">/hr-dashboard</span> for a real-time pulse of the organization, including today's absentees, pending leave requests, and upcoming birthdays/work anniversaries.</li>
          <li><strong>Employee Management:</strong> The <span class="route-badge">/employees</span> section acts as the secure digital filing cabinet for all staff records, contracts, emergency contacts, and role assignments.</li>
        </ul>
      `
    },
    {
      id: 'hr-attendance',
      title: '2. Daily Attendance & GPS Tracking',
      content: `
        <p>Accurate timekeeping is critical for payroll and operational planning.</p>
        <ol>
          <li><strong>Check-In Protocol:</strong> Every employee MUST click the green 'Check-In' button in the top navigation bar at the start of their shift. They must 'Check-Out' at the end of the day.</li>
          <li><strong>Attendance Monitoring:</strong> HR administrators use the <span class="route-badge">/attendance</span> page to identify tardiness or unexcused absences. Discrepancies should be resolved with the employee's direct manager by 11:00 AM daily.</li>
          <li><strong>Field Staff Location:</strong> For sales reps and technicians, GPS tracking is enabled. Use <span class="route-badge">/employee-location</span> to ensure field staff are adhering to their assigned routes and visiting client sites as reported.</li>
        </ol>
      `
    },
    {
      id: 'hr-approvals',
      title: '3. Leave Requests & Approvals Workflow',
      content: `
        <p>A streamlined process for managing employee time-off and expense claims.</p>
        <ul>
          <li><strong>Submitting Requests:</strong> Employees use <span class="route-badge">/leave-request</span> to apply for PTO, Sick Leave, or Maternity/Paternity leave. They must provide adequate notice as per company policy (e.g., 2 weeks for planned PTO).</li>
          <li><strong>Managerial Review:</strong> Direct managers and HR review these requests at <span class="route-badge">/pending-approvals</span>. Approvals should consider team coverage and project deadlines.</li>
          <li><strong>Expense Claims:</strong> Out-of-pocket expenses for travel or supplies are also reviewed in the pending approvals queue. Receipts must be attached to every claim.</li>
        </ul>
      `
    },
    {
      id: 'hr-reporting',
      title: '4. Workforce Analytics & Reporting',
      content: `
        <p>HR relies on data to track attrition, performance, and compliance.</p>
        <ul>
          <li><strong>Attendance & Leave Reports:</strong> Use <span class="route-badge">/attendance-report</span> and <span class="route-badge">/leave-report</span> for monthly payroll processing and identifying chronic absenteeism.</li>
          <li><strong>GPS Report:</strong> Generate <span class="route-badge">/gps-report</span> for field staff to audit travel mileage claims against actual routes taken.</li>
          <li><strong>Performance Report:</strong> The <span class="route-badge">/performance-report</span> aggregates data from CRM (sales targets) and Operations (customer feedback) to provide a holistic 360-degree view of employee performance for annual reviews.</li>
          <li><strong>Expense Auditing:</strong> Run the <span class="route-badge">/expense-report</span> quarterly to ensure departmental budgets are adhered to.</li>
        </ul>
      `
    }
  ]
};