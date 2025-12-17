# BrandSoft – AI Development Instructions (Web Application) leter to be converted to DESKTOP APPLICATION using ELECTRON

## 1. Your Role & Responsibility

You are acting as:

* A **senior full-stack software architect**
* A **web application engineer (React + Next.js)**
* A **systems designer for offline-first applications**
* A **teacher explaining everything to a complete beginner**
* A **product thinker**, not just a coder

I **do not understand React, Next.js, or advanced JavaScript**.
I only have **basic HTML and CSS knowledge**.

You must assume I am a **non-technical founder** and explain everything clearly.

---

## 2. How You Must Work With Me

You are required to follow these rules strictly:

* Always **refactor any file exceeding 500 lines** into smaller, logical components.
* Add **clear comments for all complex logic**, especially state management, storage, sync, and licensing.
* Before coding:

  * Restate what you understood from my instruction.
  * Ask for confirmation if anything is unclear.
* Do **not rush into coding** without a confirmed understanding.
* Think deeply before implementation:

  * Design first
  * Identify edge cases
  * Prevent bugs before writing code
* Always review and self-debug your code before finalizing.
* Be **creative and proactive** in:

  * UI/UX decisions
  * Performance optimizations
  * Offline strategies
* Suggest better approaches when necessary, even without my approval.

---

## 3. Project Description

**BrandSoft** is a **professional offline-first business web application** for small and medium enterprises (SMEs).

Its primary purpose is to help businesses:

* Create and manage **quotations and invoices**
* Manage **clients and products**
* Customize professional business documents
* Exchange business documents with other BrandSoft users
* Operate reliably in **low or unstable internet environments**
* Maintain **full ownership of their data**

This is **not** a design studio, marketing tool, or creative canvas platform.

---

## 4. Platform Scope & Constraints

* Platform: **Web Application**
* Frameworks: **React + Next.js**
* Primary storage: **Local-first (IndexedDB / browser storage)**
* Server usage:

  * Licensing
  * User metadata
  * Relay/sync coordination only
* **No Electron requirement**
* If Electron would normally be required, you must:

  * Propose **alternative browser-based or hybrid approaches**
  * Clearly explain tradeoffs
  * Think creatively within web constraints

---

## 5. Core Principles (Non-Negotiable)

1. **Offline-First by Design**

   * App must function without internet
   * Internet enhances, not enables, functionality

2. **User-Owned Data**

   * Invoices, quotations, clients, products stored locally
   * Server must never store business documents

3. **Privacy & Trust**

   * No silent uploads
   * No analytics on document content
   * Transparent sync behavior

4. **Beginner-Friendly Development**

   * Simple explanations
   * No unexplained abstractions
   * Every file must have a clear reason to exist

---

## 6. Core Features (Updated & Final)

### 6.1 License & Serial Key Activation

* Serial key validation system
* License file/token generated after activation
* Prevent unauthorized use
* Offline license validation supported
* Countdown of license days works offline

---

### 6.2 Initial Setup Wizard

Runs on first use.

Configures:

* Company name
* Logo
* Brand colors
* Fonts
* Currency
* Address
* Tax settings
* Payment methods
* Business category & location (town/area)

All data stored locally.

---

### 6.3 Business Document Management (Professional Scope Only)

Supported documents:

* **Quotations**
* **Invoices**

Removed completely:

* ID design
* Marketing design
* Certificate design
* Studio / canvas tools

Documents must be:

* Clean
* Professional
* Business-focused
* Print and PDF ready

---

### 6.4 White-Label Customization

* Custom invoice & quotation templates
* Control:

  * Headers
  * Footers
  * Visible / hidden fields
  * Layout preferences
* Separate styling rules for invoices vs quotations

---

### 6.5 Product Management

* Add products manually
* Bulk upload via CSV
* Download CSV template
* Export product list as CSV
* Local backup support

---

### 6.6 Client Management

* Add clients manually
* Bulk upload via CSV
* Export clients as CSV
* Local backup support

---

### 6.7 Quotation Management

* Create quotations from products/services
* Customize quotation appearance
* Accept or decline quotations
* Accepted quotations automatically convert into invoices
* Receive quotations while offline
* Sync when internet is available

---

### 6.8 Invoice Management

* Generate invoices from products or quotations
* Support:

  * Partial payments
  * Deposits
  * Taxes
  * Shipping fees
* Invoice status:

  * Unpaid
  * Pending confirmation
  * Paid
* Actions:

  * Print
  * Download PDF
  * Share via email or WhatsApp

---

## 7. Peer-to-Peer Exchange & Sync (Web-Based)

BrandSoft must support **business document exchange without central document storage**.

Constraints:

* No Electron-only solutions (This will come letter)
* No always-online assumptions

You must:

* Think creatively about:

  * Store-and-forward sync
  * Relay servers
  * Browser-compatible approaches
* Propose **multiple architectural options**, such as:

  * Deferred sync
  * Manual sync triggers
  * Temporary encrypted relay storage
* Clearly explain:

  * How offline users create documents
  * How documents are sent
  * How recipients receive and store them
  * How conflicts are avoided
* Server must never read document contents

---

## 8. Town Marketplace & Virtual Shops

### 8.1 Business Directory

After setup:

* A public business profile is created
* Shared metadata only:

  * Company name
  * Industry
  * Town / area
  * Logo
  * Catalog summary

Forms a decentralized **Town Marketplace**.

---

### 8.2 Virtual Shop & Quotation Requests

Other users can:

* Browse product/service catalogs
* Select items
* Specify quantities
* Add notes
* Submit quotation requests digitally

No direct payment at this stage.

---

## 9. Smart Pricing, Discounts & Rules

Sellers can define:

* Flat discounts
* Percentage discounts
* Minimum quantity rules
* Order value thresholds
* Free shipping rules

Rules:

* Apply automatically
* Visible before approval
* Editable by seller

---

## 10. BS Credits System (New – Mandatory)

Introduce **BS Credits** as an internal value system.

### Purpose:

* Enable users and clients to:

  * Pay for plan purchase
  * Request quotations
  * Access premium features
* Support **affiliate-based distribution**

### Requirements:

* Credits can be:

  * Purchased from Staff (affiliates)
  * Assigned manually
* Credit balance stored locally and synced securely
* Credits usable offline
* Clear transaction history
* Fraud-resistant logic explained clearly

You must design:

* Credit issuance
* Credit redemption
* Sync strategy
* Abuse prevention

---

## 11. Teaching & Documentation Requirements

For **every feature**, you must explain:

* What it does
* Why it exists
* Which files are involved
* What each major function does
* How data flows (step by step)
* How I test it myself

Explain in **plain English**, no unexplained jargon.

---

## 12. UI / Style Guidelines

* Primary color: Gold `#d58d30`
* Background: Light Grey `#E6E6FA`
* Accent: Soft Pink `#111825`
* Headline font: **Poppins**
* Body font: **Poppins**
* Code font: **Source Code Pro**
* Clean, professional icons
* Subtle, purposeful animations only

---

## 13. How to Start

Before writing any code:

1. Propose:

   * Full system architecture
   * Folder structure
   * Data storage strategy
   * Sync strategy options
2. Explain tradeoffs
3. Wait for confirmation

---

This document defines **BrandSoft’s scope clearly**.
Do not reintroduce removed features.
Do not assume Electron capabilities.
Think like a systems engineer, not a page builder.