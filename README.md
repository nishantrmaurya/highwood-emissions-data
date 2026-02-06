# We will update the task by tomorrow (2/7/2026), just will add docker compouse in files

# 🌍 Highwood Engineering Challenge: Emissions Data Platform

## **The Context**

Highwood Emissions Management is on a mission to provide industrial emissions transparency. Our platform processes vast streams of methane data from sensors, satellites, and field engineers. In our world, **data integrity is non-negotiable**. A lost packet or a double-counted emission can lead to inaccurate regulatory reporting (OGMP 2.0) and multi-million dollar implications for our clients.

## **The Challenge**

Your goal is to build the core of an **Emissions Ingestion & Analytics Engine**. This system must be resilient to unstable network conditions, handle high-concurrency updates, and be architected in a way that allows other engineers to build upon it easily.

---

## **🛠 Technology Stack**
We value the right tool for the job. While we have preferences, we are interested in how you wield your chosen stack.
* **Backend:** Node.js preferred (NestJS is our current standard), but other modern runtimes are acceptable.
* **Frontend:** React preferred (Next.js App Router is our current standard) but other frameworks like Vue or Svelt also fine.
* **Database:** **PostgreSQL is required**.
* **Cache:** **Redis is optional** (provided in the docker-compose).
* **Tools:** Any ORM (Drizzle/Prisma) and Validation libraries (Zod) are encouraged.

---

## **🚀 Core Functional Requirements**

### **1. [POST] /sites — Asset Management**

Create an industrial site (e.g., a well pad or processing plant) that requires monitoring.

* Each site must have an `emission_limit` and metadata.
* **Platform Goal:** Implement a unified error-handling and response structure that could serve as a standard for a multi-team environment.

### **2. [POST] /ingest — Reliable Batch Ingestion**

Accept a batch of methane readings (e.g., up to 100 entries) for a specific site.

* **Atomic Transactions:** In a single transaction, the system must:
1. Persist the raw measurements.
2. Atomically update the site’s `total_emissions_to_date` summary.


* **Network Resilience:** Field devices often operate in low-connectivity areas. If a client retries a request due to a timeout, the system **must not** create duplicate records or double-count the emissions in the summary.

### **3. [GET] /sites/:id/metrics — Analytics**

Retrieve a summary of a site’s performance, including its current compliance status (e.g., "Within Limit" vs. "Limit Exceeded").

### **4. [Frontend] Monitoring Dashboard**

Build a dashboard that allows an admin to:

* View all sites and their real-time emission totals.
* Use a "Manual Ingestion" form to simulate sensor data.
* **UX Resilience:** Handle API errors gracefully. Implement a "Retry" mechanism that demonstrates how the frontend and backend collaborate to prevent data duplication.

---

## **🌟 Choose Your Strength (Optional Bonus Tasks)**

*We value your time. You are not expected to complete all of these. Please select **2 or 3 items** that best demonstrate your expertise, especially if you are interested in a **Platform Team** role.*

1. **Concurrency Control:** How does the system handle 10 concurrent sources updating the same `site_id`? Implement a protection strategy (e.g., Optimistic or Pessimistic locking).
2. **Architecture Pattern:** Demonstrate a scalable approach, such as **Command/Processor patterns (OOP)** or an **Event-Driven** model.
3. **Database Scalability:** Describe or implement a **Partitioning** strategy for the measurements table (e.g., by month/year) to handle 100M+ rows.
4. **Transactional Outbox:** Implement the **Outbox Pattern** to ensure that once a measurement is saved, a downstream "Alerting Service" is guaranteed to be notified.
5. **Developer Experience (DX):** Provide a seamless setup. Ensure the project can be started with a single command (e.g., `docker-compose`) including migrations and initial seed data.
6. **Observability:** Implement basic logging or metrics that track how many requests were identified and rejected as duplicates.
7. **Type-Safe Contract:** Share Zod schemas between the backend and frontend to ensure end-to-end type safety.
8. **API Versioning:** Implement a versioning strategy (e.g., Header or URI-based) that ensures backward compatibility for older IoT sensors.

---

## **📦 What We Are Looking For**

* **Engineering Maturity:** How you handle "The Hard Parts"—concurrency, atomicity, and failures.
* **Platform Thinking:** Is your code modular? Is it easy for another developer to understand your abstractions?
* **Data Integrity:** Does your solution truly prevent double-counting under stress?
* **Documentation:** Please include an `ARCHITECTURE.md` file (or ADR) briefly explaining your key technical decisions and trade-offs.

---

### **Submission**

* Please provide a link to a **private GitHub repository**.

* **Deployment (Bonus):** We highly encourage you to deploy your solution (e.g., to Vercel, Render, Railway, or AWS). Provide a live URL in your README.

* If a live demo is not possible, ensure your `docker-compose` setup is flawless so we can run it locally in one command.

**Good luck! We are excited to see how you approach these challenges.**

