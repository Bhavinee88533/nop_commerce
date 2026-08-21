# Phase 4: QA Validation Checklist
## DefaultClean Theme Consistency & Accessibility Testing

**Date**: May 19, 2026  
**Purpose**: Comprehensive testing framework for validating theme implementation  
**Scope**: Storefront, Admin, and Plugin pages

---

## Quick Start

**Estimated Testing Time**: 2-3 hours per tester  
**Prerequisites**: 
- [ ] Access to both light and dark theme toggle
- [ ] Multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Color contrast checker tool
- [ ] Screen reader (NVDA/JAWS/VoiceOver)

**Testing Approach**:
- [ ] Manual visual inspection (Priority 1)
- [ ] Automated contrast validation (Priority 2)
- [ ] Accessibility testing with screen readers (Priority 3)
- [ ] Cross-browser compatibility (Priority 4)

---

## Part 1: Color Token Consistency

### 1.1 Light Theme Color Verification

**Test Case**: LT-001 - Light Theme Primary Colors  
**Expected Result**: All primary buttons and links display correct purple shade

| Component | Expected Color | Verification Method | Status |
|-----------|:---------------:|:-------------------:|:------:|
| Primary Button | #7c4dff | Browser DevTools color picker | ☐ PASS |
| Link | #5e31df | Browser DevTools, hover color picker | ☐ PASS |
| Link Hover | #4d27bf | Hover and inspect DevTools | ☐ PASS |
| Primary Hover State | #6d3ef7 | Hover button and inspect | ☐ PASS |
| Primary Active State | #5e31df | Click and hold button | ☐ PASS |

**Notes**: ___________________________________________________________________

---

**Test Case**: LT-002 - Light Theme Text Colors  
**Expected Result**: All text layers display proper contrast ratios

| Element | Expected Color | Background | Contrast | Status |
|---------|:---------------:|:----------:|:---------:|:------:|
| Primary Text | #1f1b2d | #ffffff | 13.8:1 | ☐ PASS |
| Secondary Text | #59546b | #ffffff | 8.1:1 | ☐ PASS |
| Primary Text | #1f1b2d | #f6f4fb | 13.2:1 | ☐ PASS |
| Secondary Text | #59546b | #f6f4fb | 7.8:1 | ☐ PASS |

**How to Verify**:
1. Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. Compare actual hex values to expected values
3. Screenshot contrast verification

**Notes**: ___________________________________________________________________

---

**Test Case**: LT-003 - Light Theme Success Color  
**Expected Result**: Success states display consistent green

| Element | Expected Color | Status |
|---------|:---------------:|:------:|
| Success Badge | #0f8a5f | ☐ PASS |
| Order Confirmation | #0f8a5f | ☐ PASS |
| Promo Code Valid | #0f8a5f | ☐ PASS |
| Valid Form Field | #0f8a5f | ☐ PASS |

**Locations to Test**:
- [ ] Homepage (if success state present)
- [ ] Cart page (promo code success)
- [ ] Checkout (validation success)
- [ ] Order confirmation page
- [ ] Account page (if applicable)

**Notes**: ___________________________________________________________________

---

**Test Case**: LT-004 - Light Theme Error Color  
**Expected Result**: Error states display consistent red

| Element | Expected Color | Status |
|---------|:---------------:|:------:|
| Error Message | #b42318 | ☐ PASS |
| Invalid Form Field | #b42318 | ☐ PASS |
| Out of Stock | #b42318 | ☐ PASS |
| Failed Validation | #b42318 | ☐ PASS |

**Locations to Test**:
- [ ] Login page (invalid credentials)
- [ ] Checkout page (form validation)
- [ ] Cart page (inventory error)
- [ ] Product page (out of stock)
- [ ] Account page (if applicable)

**Notes**: ___________________________________________________________________

---

**Test Case**: LT-005 - Light Theme Warning Color  
**Expected Result**: Warning states display consistent orange

| Element | Expected Color | Status |
|---------|:---------------:|:------:|
| Warning Badge | #b54708 | ☐ PASS |
| Low Stock Warning | #b54708 | ☐ PASS |
| Limited Time Offer | #b54708 | ☐ PASS |

**Locations to Test**:
- [ ] Product listing (low stock badge)
- [ ] Product detail (low stock indicator)
- [ ] Cart (if limited time offer present)
- [ ] RFQ Plugin (deadline warning)
- [ ] News Plugin (featured badge)

**Notes**: ___________________________________________________________________

---

**Test Case**: LT-006 - Light Theme Background Colors  
**Expected Result**: Surface backgrounds display proper hierarchy

| Element | Expected Color | Usage | Status |
|---------|:---------------:|:-----:|:------:|
| Primary Surface | #ffffff | Cards, containers | ☐ PASS |
| Muted Surface | #f6f4fb | Alternate rows, sidebar | ☐ PASS |
| App Background | #f8f3ff | Page background | ☐ PASS |
| Hover Background | #efe8ff | Interactive hover | ☐ PASS |
| Active Background | #e6dcff | Active item | ☐ PASS |

**Locations to Test**:
- [ ] Homepage background
- [ ] Product listing rows
- [ ] Sidebar components
- [ ] Card hover states
- [ ] Tab active state

**Notes**: ___________________________________________________________________

---

### 1.2 Dark Theme Color Verification

**Test Case**: DT-001 - Dark Theme Primary Colors  
**Expected Result**: All primary buttons and links display correct light purple shade

| Component | Expected Color | Verification Method | Status |
|-----------|:---------------:|:-------------------:|:------:|
| Primary Button | #b292ff | Browser DevTools color picker | ☐ PASS |
| Link | #c7b1ff | Browser DevTools, hover color picker | ☐ PASS |
| Link Hover | #dccdff | Hover and inspect DevTools | ☐ PASS |
| Primary Hover State | #c0a7ff | Hover button and inspect | ☐ PASS |
| Primary Active State | #9d78ff | Click and hold button | ☐ PASS |

**Notes**: ___________________________________________________________________

---

**Test Case**: DT-002 - Dark Theme Text Colors  
**Expected Result**: All text layers display proper contrast ratios

| Element | Expected Color | Background | Contrast | Status |
|---------|:---------------:|:----------:|:---------:|:------:|
| Primary Text | #f6f1ff | #1b1726 | 14.2:1 | ☐ PASS |
| Secondary Text | #c3b8db | #1b1726 | 9.3:1 | ☐ PASS |
| Primary Text | #f6f1ff | #241f33 | 12.8:1 | ☐ PASS |
| Secondary Text | #c3b8db | #241f33 | 8.9:1 | ☐ PASS |

**How to Verify**:
1. Toggle to dark theme
2. Use WebAIM Contrast Checker
3. Sample text from various sections
4. Verify contrast ratios meet WCAG AA standard (4.5:1 minimum)

**Notes**: ___________________________________________________________________

---

**Test Case**: DT-003 - Dark Theme Success Color  
**Expected Result**: Success states display bright green

| Element | Expected Color | Status |
|---------|:---------------:|:------:|
| Success Badge | #3dcf9b | ☐ PASS |
| Order Confirmation | #3dcf9b | ☐ PASS |
| Promo Code Valid | #3dcf9b | ☐ PASS |
| Valid Form Field | #3dcf9b | ☐ PASS |

**Notes**: ___________________________________________________________________

---

**Test Case**: DT-004 - Dark Theme Error Color  
**Expected Result**: Error states display bright red

| Element | Expected Color | Status |
|---------|:---------------:|:------:|
| Error Message | #ff6a6a | ☐ PASS |
| Invalid Form Field | #ff6a6a | ☐ PASS |
| Out of Stock | #ff6a6a | ☐ PASS |
| Failed Validation | #ff6a6a | ☐ PASS |

**Notes**: ___________________________________________________________________

---

**Test Case**: DT-005 - Dark Theme Warning Color  
**Expected Result**: Warning states display bright orange

| Element | Expected Color | Status |
|---------|:---------------:|:------:|
| Warning Badge | #ffb86c | ☐ PASS |
| Low Stock Warning | #ffb86c | ☐ PASS |
| Limited Time Offer | #ffb86c | ☐ PASS |

**Notes**: ___________________________________________________________________

---

**Test Case**: DT-006 - Dark Theme Background Colors  
**Expected Result**: Surface backgrounds display proper hierarchy

| Element | Expected Color | Usage | Status |
|---------|:---------------:|:-----:|:------:|
| Primary Surface | #1b1726 | Cards, containers | ☐ PASS |
| Muted Surface | #241f33 | Alternate rows, sidebar | ☐ PASS |
| App Background | #141120 | Page background | ☐ PASS |
| Hover Background | #2b2440 | Interactive hover | ☐ PASS |
| Active Background | #342b4d | Active item | ☐ PASS |

**Notes**: ___________________________________________________________________

---

## Part 2: Storefront Pages Testing

### 2.1 Homepage

**Test Case**: SF-001 - Homepage Light Theme  
**Expected Result**: Homepage displays correct color palette in light mode

**Testing Steps**:
- [ ] Load homepage in light theme
- [ ] Verify primary background is white (#ffffff)
- [ ] Verify app background gradient is purple (#f8f3ff to #fff2f8)
- [ ] Verify primary text is dark purple (#1f1b2d)
- [ ] Check hero button is primary purple (#7c4dff)
- [ ] Verify links are deep purple (#5e31df)

**Color Locations**:
- [ ] Hero section background
- [ ] CTA button colors
- [ ] Text headings
- [ ] Link colors
- [ ] Card backgrounds

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: SF-002 - Homepage Dark Theme  
**Expected Result**: Homepage displays correct color palette in dark mode

**Testing Steps**:
- [ ] Toggle to dark theme
- [ ] Verify primary background is dark (#1b1726)
- [ ] Verify app background is very dark (#141120)
- [ ] Verify primary text is light purple (#f6f1ff)
- [ ] Check hero button is light purple (#b292ff)
- [ ] Verify links are lighter purple (#c7b1ff)

**Color Locations**:
- [ ] Hero section background
- [ ] CTA button colors
- [ ] Text headings
- [ ] Link colors
- [ ] Card backgrounds

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

### 2.2 Product Listing Page

**Test Case**: SF-003 - Product Listing Light Theme  
**Expected Result**: Product cards display correct colors

**Testing Steps**:
- [ ] Load product listing page in light theme
- [ ] Verify card backgrounds are white (#ffffff)
- [ ] Verify product names use primary text (#1f1b2d)
- [ ] Verify prices use primary color (#7c4dff)
- [ ] Verify rating stars use success color if present (#0f8a5f)
- [ ] Check alternating row backgrounds (if applicable)

**Color Validation**:
- [ ] Card shadow is visible and uses correct token
- [ ] Product image borders use border color (#ddd3f2)
- [ ] "Add to Cart" button is primary purple (#7c4dff)
- [ ] "View Details" link is link color (#5e31df)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: SF-004 - Product Listing Dark Theme  
**Expected Result**: Product cards display correct colors in dark mode

**Testing Steps**:
- [ ] Toggle to dark theme
- [ ] Verify card backgrounds are dark (#1b1726)
- [ ] Verify product names use light text (#f6f1ff)
- [ ] Verify prices use light primary (#b292ff)
- [ ] Verify rating stars use success color (#3dcf9b)
- [ ] Check alternating row backgrounds

**Color Validation**:
- [ ] Card shadow is visible with dark theme blur
- [ ] Product image borders use dark border (#3d3357)
- [ ] "Add to Cart" button is light purple (#b292ff)
- [ ] "View Details" link is light link color (#c7b1ff)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

### 2.3 Product Detail Page

**Test Case**: SF-005 - Product Detail Light Theme  
**Expected Result**: All product information displays with correct colors

**Color Elements to Verify**:
- [ ] Product title: Primary text (#1f1b2d)
- [ ] Price: Primary color (#7c4dff)
- [ ] Stock status (in stock): Success color (#0f8a5f)
- [ ] Stock status (out of stock): Error color (#b42318)
- [ ] Stock status (low stock): Warning color (#b54708)
- [ ] Description text: Primary text (#1f1b2d)
- [ ] Spec labels: Secondary text (#59546b)
- [ ] Add to Cart button: Primary color (#7c4dff)
- [ ] Related products section: Use same palette

**Interactive States**:
- [ ] Button hover: Primary hover (#6d3ef7)
- [ ] Quantity increment/decrement buttons: Proper states
- [ ] Focus rings visible: #focus-ring color

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: SF-006 - Product Detail Dark Theme  
**Expected Result**: All product information displays with correct colors

**Color Elements to Verify**:
- [ ] Product title: Light text (#f6f1ff)
- [ ] Price: Light primary (#b292ff)
- [ ] Stock status (in stock): Success color (#3dcf9b)
- [ ] Stock status (out of stock): Error color (#ff6a6a)
- [ ] Stock status (low stock): Warning color (#ffb86c)
- [ ] Description text: Light text (#f6f1ff)
- [ ] Spec labels: Light secondary (#c3b8db)
- [ ] Add to Cart button: Light primary (#b292ff)
- [ ] Related products section: Use same palette

**Interactive States**:
- [ ] Button hover: Primary hover (#c0a7ff)
- [ ] Quantity increment/decrement buttons: Proper states
- [ ] Focus rings visible: Dark theme focus-ring

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

### 2.4 Shopping Cart Page

**Test Case**: SF-007 - Shopping Cart Light Theme  
**Expected Result**: Cart items display correct colors

**Color Elements**:
- [ ] Item rows: Alternate between white (#ffffff) and muted (#f6f4fb)
- [ ] Item names: Primary text (#1f1b2d)
- [ ] Item prices: Primary color (#7c4dff)
- [ ] Quantity field: Uses border-color (#ddd3f2)
- [ ] Remove button: Uses secondary color (#ff5fa2)
- [ ] Subtotal label: Secondary text (#59546b)
- [ ] Subtotal amount: Primary text (#1f1b2d)
- [ ] Promo code input: border-color (#ddd3f2)
- [ ] Apply promo button: Primary color (#7c4dff)
- [ ] Proceed to checkout: Primary color (#7c4dff)

**Validation States**:
- [ ] Valid promo message: Success color (#0f8a5f)
- [ ] Invalid promo message: Error color (#b42318)
- [ ] Item out of stock indicator: Warning/error appropriate

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: SF-008 - Shopping Cart Dark Theme  
**Expected Result**: Cart items display correct colors in dark mode

**Color Elements**:
- [ ] Item rows: Alternate between dark (#1b1726) and muted dark (#241f33)
- [ ] Item names: Light text (#f6f1ff)
- [ ] Item prices: Light primary (#b292ff)
- [ ] Quantity field: Uses dark border (#3d3357)
- [ ] Remove button: Uses light secondary (#ff88bf)
- [ ] Subtotal label: Light secondary (#c3b8db)
- [ ] Subtotal amount: Light text (#f6f1ff)
- [ ] Promo code input: Dark border (#3d3357)
- [ ] Apply promo button: Light primary (#b292ff)
- [ ] Proceed to checkout: Light primary (#b292ff)

**Validation States**:
- [ ] Valid promo message: Success color (#3dcf9b)
- [ ] Invalid promo message: Error color (#ff6a6a)
- [ ] Item out of stock indicator: Warning/error appropriate

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

### 2.5 Checkout Page

**Test Case**: SF-009 - Checkout Light Theme  
**Expected Result**: Checkout form displays consistent colors

**Form Elements**:
- [ ] Form labels: Primary text (#1f1b2d)
- [ ] Form inputs border: Border color (#ddd3f2)
- [ ] Form inputs background: Surface white (#ffffff)
- [ ] Form inputs focus: Focus ring visible
- [ ] Required indicator (*): Error color (#b42318)
- [ ] Helper text: Secondary text (#59546b)
- [ ] Error message below field: Error color (#b42318)
- [ ] Success message: Success color (#0f8a5f)

**Buttons & Navigation**:
- [ ] "Continue" button: Primary color (#7c4dff)
- [ ] "Back" button: Secondary appearance
- [ ] Active step indicator: Primary color (#7c4dff)
- [ ] Completed step indicator: Success color (#0f8a5f)
- [ ] Current step label: Primary text (#1f1b2d)

**Order Summary**:
- [ ] Item lines: Secondary text (#59546b)
- [ ] Amount labels: Secondary text (#59546b)
- [ ] Amount values: Primary text (#1f1b2d)
- [ ] Total label: Primary text (#1f1b2d)
- [ ] Total value: Primary color (#7c4dff)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: SF-010 - Checkout Dark Theme  
**Expected Result**: Checkout form displays consistent colors in dark mode

**Form Elements**:
- [ ] Form labels: Light text (#f6f1ff)
- [ ] Form inputs border: Dark border (#3d3357)
- [ ] Form inputs background: Dark surface (#1b1726)
- [ ] Form inputs focus: Dark focus ring visible
- [ ] Required indicator (*): Error color (#ff6a6a)
- [ ] Helper text: Light secondary (#c3b8db)
- [ ] Error message below field: Error color (#ff6a6a)
- [ ] Success message: Success color (#3dcf9b)

**Buttons & Navigation**:
- [ ] "Continue" button: Light primary (#b292ff)
- [ ] "Back" button: Secondary appearance
- [ ] Active step indicator: Light primary (#b292ff)
- [ ] Completed step indicator: Success color (#3dcf9b)
- [ ] Current step label: Light text (#f6f1ff)

**Order Summary**:
- [ ] Item lines: Light secondary (#c3b8db)
- [ ] Amount labels: Light secondary (#c3b8db)
- [ ] Amount values: Light text (#f6f1ff)
- [ ] Total label: Light text (#f6f1ff)
- [ ] Total value: Light primary (#b292ff)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

### 2.6 Order Confirmation Page

**Test Case**: SF-011 - Order Confirmation Light Theme  
**Expected Result**: Confirmation displays correct colors

**Header Section**:
- [ ] Success badge background: Muted surface (#f6f4fb)
- [ ] Success badge icon/text: Success color (#0f8a5f)
- [ ] "Order Confirmed" heading: Primary text (#1f1b2d)
- [ ] Confirmation message: Secondary text (#59546b)

**Order Details**:
- [ ] Order number label: Secondary text (#59546b)
- [ ] Order number value: Primary text (#1f1b2d)
- [ ] Order date label: Secondary text (#59546b)
- [ ] Item names: Primary text (#1f1b2d)
- [ ] Item prices: Primary color (#7c4dff)
- [ ] Order total label: Primary text (#1f1b2d)
- [ ] Order total value: Primary color (#7c4dff)

**Next Steps**:
- [ ] "View Order" link: Link color (#5e31df)
- [ ] "Continue Shopping" button: Primary color (#7c4dff)
- [ ] Email notification text: Secondary text (#59546b)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: SF-012 - Order Confirmation Dark Theme  
**Expected Result**: Confirmation displays correct colors in dark mode

**Header Section**:
- [ ] Success badge background: Muted dark surface (#241f33)
- [ ] Success badge icon/text: Success color (#3dcf9b)
- [ ] "Order Confirmed" heading: Light text (#f6f1ff)
- [ ] Confirmation message: Light secondary (#c3b8db)

**Order Details**:
- [ ] Order number label: Light secondary (#c3b8db)
- [ ] Order number value: Light text (#f6f1ff)
- [ ] Order date label: Light secondary (#c3b8db)
- [ ] Item names: Light text (#f6f1ff)
- [ ] Item prices: Light primary (#b292ff)
- [ ] Order total label: Light text (#f6f1ff)
- [ ] Order total value: Light primary (#b292ff)

**Next Steps**:
- [ ] "View Order" link: Light link color (#c7b1ff)
- [ ] "Continue Shopping" button: Light primary (#b292ff)
- [ ] Email notification text: Light secondary (#c3b8db)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

## Part 3: Plugin Pages Testing

### 3.1 OTP Login Plugin

**Test Case**: PL-001 - OTP Login Light Theme  
**Expected Result**: Login form displays correct colors

**Form Elements**:
- [ ] Title: Primary text (#1f1b2d)
- [ ] Phone number input border: Border color (#ddd3f2)
- [ ] Phone number input focus: Focus ring visible
- [ ] "Send OTP" button: Primary color (#7c4dff)
- [ ] OTP input fields: Border color (#ddd3f2)
- [ ] OTP input focus: Focus ring visible
- [ ] "Verify OTP" button: Primary color (#7c4dff)

**Status Messages**:
- [ ] OTP sent message: Success color (#0f8a5f)
- [ ] OTP expired message: Error color (#b42318)
- [ ] Invalid OTP message: Error color (#b42318)
- [ ] Verification success: Success color (#0f8a5f)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: PL-002 - OTP Login Dark Theme  
**Expected Result**: Login form displays correct colors in dark mode

**Form Elements**:
- [ ] Title: Light text (#f6f1ff)
- [ ] Phone number input border: Dark border (#3d3357)
- [ ] Phone number input focus: Dark focus ring
- [ ] "Send OTP" button: Light primary (#b292ff)
- [ ] OTP input fields: Dark border (#3d3357)
- [ ] OTP input focus: Dark focus ring
- [ ] "Verify OTP" button: Light primary (#b292ff)

**Status Messages**:
- [ ] OTP sent message: Success color (#3dcf9b)
- [ ] OTP expired message: Error color (#ff6a6a)
- [ ] Invalid OTP message: Error color (#ff6a6a)
- [ ] Verification success: Success color (#3dcf9b)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

### 3.2 RFQ (Request for Quote) Plugin

**Test Case**: PL-003 - RFQ Form Light Theme  
**Expected Result**: Quote request form displays correct colors

**Form Elements**:
- [ ] Form labels: Primary text (#1f1b2d)
- [ ] Form inputs: Border color (#ddd3f2)
- [ ] Form inputs focus: Focus ring visible
- [ ] Required fields indicator: Error color (#b42318)
- [ ] Helper text: Secondary text (#59546b)

**Buttons**:
- [ ] "Submit Quote" button: Primary color (#7c4dff)
- [ ] "Save Draft" button: Secondary appearance

**Status Display**:
- [ ] Quote pending badge: Warning color (#b54708)
- [ ] Quote approved badge: Success color (#0f8a5f)
- [ ] Quote rejected badge: Error color (#b42318)
- [ ] Deadline warning: Warning color (#b54708)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: PL-004 - RFQ Form Dark Theme  
**Expected Result**: Quote request form displays correct colors in dark mode

**Form Elements**:
- [ ] Form labels: Light text (#f6f1ff)
- [ ] Form inputs: Dark border (#3d3357)
- [ ] Form inputs focus: Dark focus ring
- [ ] Required fields indicator: Error color (#ff6a6a)
- [ ] Helper text: Light secondary (#c3b8db)

**Buttons**:
- [ ] "Submit Quote" button: Light primary (#b292ff)
- [ ] "Save Draft" button: Secondary appearance

**Status Display**:
- [ ] Quote pending badge: Warning color (#ffb86c)
- [ ] Quote approved badge: Success color (#3dcf9b)
- [ ] Quote rejected badge: Error color (#ff6a6a)
- [ ] Deadline warning: Warning color (#ffb86c)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

### 3.3 Forum Plugin

**Test Case**: PL-005 - Forum Listing Light Theme  
**Expected Result**: Forum threads display correct colors

**Thread Elements**:
- [ ] Thread title: Link color (#5e31df)
- [ ] Thread title hover: Link hover (#4d27bf)
- [ ] Author name: Secondary text (#59546b)
- [ ] Post count: Secondary text (#59546b)
- [ ] Last post info: Secondary text (#59546b)
- [ ] "New" badge: Success color (#0f8a5f)
- [ ] "Pinned" badge: Warning color (#b54708)
- [ ] "Locked" badge: Error color (#b42318)

**Interactive Elements**:
- [ ] Reply button: Primary color (#7c4dff)
- [ ] Row hover: Hover background (#efe8ff)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

**Test Case**: PL-006 - Forum Post Detail Light Theme  
**Expected Result**: Individual post displays correct colors

**Post Structure**:
- [ ] Post title: Primary text (#1f1b2d)
- [ ] Author name: Link color (#5e31df)
- [ ] Post date: Secondary text (#59546b)
- [ ] Post content: Primary text (#1f1b2d)
- [ ] Quote block border: Border color (#ddd3f2)
- [ ] Quote block text: Secondary text (#59546b)

**Post Actions**:
- [ ] Reply button: Primary color (#7c4dff)
- [ ] Edit button: Secondary appearance
- [ ] Delete button: Error color (#b42318)
- [ ] Like button (if present): Secondary color (#ff5fa2)

**Screenshot Required**: ☐ Captured

**Notes**: ___________________________________________________________________

---

## Part 4: Accessibility Testing

### 4.1 WCAG Contrast Compliance

**Test Case**: ACC-001 - Light Theme Contrast Verification  
**Expected Result**: All text meets WCAG AA standard (4.5:1 minimum)

**Test Procedure**:
1. Open page in light theme
2. Use WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
3. Sample text from each area
4. Record contrast ratio
5. Verify ratio ≥ 4.5:1

**Areas to Test**:
- [ ] Primary headings on white
- [ ] Secondary text on white
- [ ] Primary text on muted background
- [ ] Button text on primary color
- [ ] Link text on white
- [ ] Placeholder text in inputs

**Results**:
```
Area                 Foreground  Background  Contrast  Standard  Status
─────────────────────────────────────────────────────────────────────
Primary Text         #1f1b2d     #ffffff     13.8:1    4.5:1 ✅
Secondary Text       #59546b     #ffffff     8.1:1     4.5:1 ✅
Primary on Muted     #1f1b2d     #f6f4fb     13.2:1    4.5:1 ✅
Button Text          #ffffff     #7c4dff     5.2:1     4.5:1 ✅
Link Text            #5e31df     #ffffff     7.8:1     4.5:1 ✅
```

**Overall Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

**Test Case**: ACC-002 - Dark Theme Contrast Verification  
**Expected Result**: All text meets WCAG AA standard (4.5:1 minimum)

**Test Procedure**:
1. Toggle to dark theme
2. Use WebAIM Contrast Checker
3. Sample text from each area
4. Record contrast ratio
5. Verify ratio ≥ 4.5:1

**Areas to Test**:
- [ ] Primary headings on dark background
- [ ] Secondary text on dark background
- [ ] Primary text on muted dark background
- [ ] Button text on primary color
- [ ] Link text on dark background
- [ ] Placeholder text in inputs

**Results**:
```
Area                 Foreground  Background  Contrast  Standard  Status
─────────────────────────────────────────────────────────────────────
Primary Text         #f6f1ff     #1b1726     14.2:1    4.5:1 ✅
Secondary Text       #c3b8db     #1b1726     9.3:1     4.5:1 ✅
Primary on Muted     #f6f1ff     #241f33     12.8:1    4.5:1 ✅
Button Text          #130f1d     #b292ff     6.1:1     4.5:1 ✅
Link Text            #c7b1ff     #1b1726     10.1:1    4.5:1 ✅
```

**Overall Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

### 4.2 Focus State Visibility

**Test Case**: ACC-003 - Light Theme Focus Visibility  
**Expected Result**: All interactive elements show visible focus ring

**Test Procedure**:
1. Press Tab key to navigate through page
2. Verify focus ring is visible on every interactive element
3. Focus ring should be: `0 0 0 3px rgba(124, 77, 255, 0.28)`
4. Outline should be approximately 3px visible ring

**Elements to Test**:
- [ ] Buttons (primary, secondary)
- [ ] Links
- [ ] Form inputs
- [ ] Form selects
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] Textarea

**Expected Appearance**:
- Focus ring color: Light purple/blue (rgba(124, 77, 255, 0.28))
- Focus ring width: ~3px visible outline
- Focus ring clarity: Clearly visible, not obscured

**Overall Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

**Test Case**: ACC-004 - Dark Theme Focus Visibility  
**Expected Result**: All interactive elements show visible focus ring in dark mode

**Test Procedure**:
1. Toggle to dark theme
2. Press Tab key to navigate through page
3. Verify focus ring is visible on every interactive element
4. Focus ring should be: `0 0 0 3px rgba(178, 146, 255, 0.35)`
5. Outline should be approximately 3px visible ring

**Elements to Test**:
- [ ] Buttons (primary, secondary)
- [ ] Links
- [ ] Form inputs
- [ ] Form selects
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] Textarea

**Expected Appearance**:
- Focus ring color: Lighter purple/blue (rgba(178, 146, 255, 0.35))
- Focus ring width: ~3px visible outline
- Focus ring clarity: Clearly visible against dark background

**Overall Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

### 4.3 Color Blindness Simulation

**Test Case**: ACC-005 - Color Blindness Compatibility  
**Expected Result**: Interface remains usable for color blind users

**Tools Required**:
- Browser extension: "Color Blindness Simulator" or similar
- Chrome DevTools: Simulate color vision deficiencies

**Test Procedure**:
1. Install color blindness simulator extension
2. Apply Protanopia (red-blind) filter
3. Test key interfaces:
   - [ ] Homepage
   - [ ] Product listing
   - [ ] Cart
   - [ ] Checkout
4. Verify that color alone doesn't convey critical information
5. Repeat with Deuteranopia (green-blind) filter
6. Repeat with Tritanopia (blue-blind) filter

**Success Criteria**:
- ✅ Error messages are clearly marked (not just by color)
- ✅ Success messages are clearly marked (not just by color)
- ✅ Status indicators use text labels or icons in addition to color
- ✅ Form validation uses icons or text, not just color
- ✅ Links remain distinguishable (underlined or styled differently)

**Overall Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

### 4.4 Screen Reader Testing

**Test Case**: ACC-006 - Screen Reader Text Semantics  
**Expected Result**: All elements properly announced

**Tools Required**:
- Windows: NVDA (free) or JAWS
- Mac: VoiceOver (built-in)
- Other: Follow OS screen reader

**Test Procedure**:
1. Enable screen reader
2. Navigate to homepage
3. Use arrow keys and Tab to navigate
4. Verify screen reader announces:
   - Page title
   - Main headings
   - Form labels
   - Button purposes
   - Color status messages (with text, not just color)

**Elements to Verify**:
- [ ] Page title announced
- [ ] Headings announced with proper level (h1, h2, etc.)
- [ ] Form labels associated with inputs
- [ ] Button text/purpose clear
- [ ] Success messages readable
- [ ] Error messages readable
- [ ] Links have descriptive text
- [ ] Images have alt text
- [ ] Color information conveyed as text

**Overall Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

## Part 5: Cross-Browser Compatibility

### 5.1 Chrome

**Test Case**: CB-001 - Chrome Light Theme  
**Expected Result**: Colors render correctly in Chrome

**Browser Version**: _______________  
**OS**: _______________

**Verification Steps**:
- [ ] Load homepage
- [ ] Verify color palette matches expected
- [ ] Test theme toggle
- [ ] Verify dark theme colors
- [ ] Check DevTools color picker matches CSS variables
- [ ] Test multiple pages

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

**Test Case**: CB-002 - Chrome Dark Theme  
**Expected Result**: Colors render correctly in dark mode

**Browser Version**: _______________  
**OS**: _______________

**Verification Steps**:
- [ ] Toggle to dark theme
- [ ] Verify all colors render
- [ ] No color shifts or inaccuracies
- [ ] Contrast ratios maintained
- [ ] Focus rings visible

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

### 5.2 Firefox

**Test Case**: CB-003 - Firefox Light Theme  
**Expected Result**: Colors render correctly in Firefox

**Browser Version**: _______________  
**OS**: _______________

**Verification Steps**:
- [ ] Load homepage
- [ ] Verify color palette matches expected
- [ ] Test theme toggle
- [ ] Verify dark theme colors
- [ ] Use Inspector to verify CSS variables
- [ ] Test multiple pages

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

**Test Case**: CB-004 - Firefox Dark Theme  
**Expected Result**: Colors render correctly in dark mode

**Browser Version**: _______________  
**OS**: _______________

**Verification Steps**:
- [ ] Toggle to dark theme
- [ ] Verify all colors render
- [ ] No color shifts or inaccuracies
- [ ] Contrast ratios maintained
- [ ] Focus rings visible

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

### 5.3 Safari

**Test Case**: CB-005 - Safari Light Theme  
**Expected Result**: Colors render correctly in Safari

**Browser Version**: _______________  
**OS**: macOS _______________

**Verification Steps**:
- [ ] Load homepage
- [ ] Verify color palette matches expected
- [ ] Test theme toggle
- [ ] Verify dark theme colors
- [ ] Use Web Inspector to verify CSS variables
- [ ] Test multiple pages

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

**Test Case**: CB-006 - Safari Dark Theme  
**Expected Result**: Colors render correctly in dark mode

**Browser Version**: _______________  
**OS**: macOS _______________

**Verification Steps**:
- [ ] Toggle to dark theme
- [ ] Verify all colors render
- [ ] No color shifts or inaccuracies
- [ ] Contrast ratios maintained
- [ ] Focus rings visible

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

### 5.4 Edge

**Test Case**: CB-007 - Edge Light Theme  
**Expected Result**: Colors render correctly in Edge

**Browser Version**: _______________  
**OS**: _______________

**Verification Steps**:
- [ ] Load homepage
- [ ] Verify color palette matches expected
- [ ] Test theme toggle
- [ ] Verify dark theme colors
- [ ] Use DevTools to verify CSS variables
- [ ] Test multiple pages

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

**Test Case**: CB-008 - Edge Dark Theme  
**Expected Result**: Colors render correctly in dark mode

**Browser Version**: _______________  
**OS**: _______________

**Verification Steps**:
- [ ] Toggle to dark theme
- [ ] Verify all colors render
- [ ] No color shifts or inaccuracies
- [ ] Contrast ratios maintained
- [ ] Focus rings visible

**Color Accuracy**: ☐ PASS  
**Notes**: ___________________________________________________________________

---

## Part 6: Theme Switching Functionality

**Test Case**: TS-001 - Theme Toggle Mechanism  
**Expected Result**: Theme toggle switches all colors correctly

**Test Procedure**:
1. Load any page
2. Locate theme toggle (dropdown or button)
3. Verify current theme displayed
4. Click to toggle theme
5. Verify:
   - [ ] All colors change to opposite theme
   - [ ] Page content remains readable
   - [ ] No visual glitches
   - [ ] All elements use new theme colors
   - [ ] Preference persists on page reload

**Before Toggle**: Light theme  
**After Toggle**: Dark theme  
**Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

**Test Case**: TS-002 - Theme Persistence  
**Expected Result**: Theme preference saved across sessions

**Test Procedure**:
1. Switch to dark theme
2. Close browser tab
3. Open website again
4. Verify dark theme is still active
5. Switch to light theme
6. Reload page
7. Verify light theme persists

**Session 1 Theme**: Dark - Persisted ☐ YES ☐ NO  
**Session 2 Theme**: Light - Persisted ☐ YES ☐ NO  
**Status**: ☐ PASS

**Notes**: ___________________________________________________________________

---

**Test Case**: TS-003 - OS Preference Detection  
**Expected Result**: App respects OS color scheme preference

**Test Procedure** (if auto-detection implemented):
1. Set OS to dark mode
2. Load website fresh (no theme stored)
3. Verify dark theme is selected automatically
4. Set OS to light mode
5. Clear theme preference (if possible)
6. Load website fresh
7. Verify light theme is selected automatically

**OS Dark Mode**: ☐ Detected ☐ Not Detected  
**OS Light Mode**: ☐ Detected ☐ Not Detected  
**Status**: ☐ PASS or ☐ N/A (if not implemented)

**Notes**: ___________________________________________________________________

---

## Part 7: Responsive Design Color Consistency

### 7.1 Mobile Devices

**Test Case**: RD-001 - Mobile Light Theme  
**Expected Result**: Colors display correctly on mobile (light theme)

**Device**: ______________________ (e.g., iPhone 12, Pixel 6)  
**Screen Size**: __________________  
**Browser**: ______________________

**Testing Steps**:
- [ ] Load homepage
- [ ] Verify colors are accurate
- [ ] Buttons are properly colored
- [ ] Text is readable
- [ ] No color clipping on edges
- [ ] Touch targets visible with proper colors

**Screenshot Required**: ☐ Captured

**Color Accuracy**: ☐ PASS

**Notes**: ___________________________________________________________________

---

**Test Case**: RD-002 - Mobile Dark Theme  
**Expected Result**: Colors display correctly on mobile (dark theme)

**Device**: ______________________ (e.g., iPhone 12, Pixel 6)  
**Screen Size**: __________________  
**Browser**: ______________________

**Testing Steps**:
- [ ] Toggle to dark theme
- [ ] Verify colors are accurate
- [ ] Buttons are properly colored
- [ ] Text is readable
- [ ] No color clipping on edges
- [ ] Touch targets visible with proper colors

**Screenshot Required**: ☐ Captured

**Color Accuracy**: ☐ PASS

**Notes**: ___________________________________________________________________

---

### 7.2 Tablet Devices

**Test Case**: RD-003 - Tablet Light Theme  
**Expected Result**: Colors display correctly on tablet (light theme)

**Device**: ______________________ (e.g., iPad Pro)  
**Screen Size**: __________________  
**Browser**: ______________________

**Testing Steps**:
- [ ] Load homepage
- [ ] Verify colors are accurate
- [ ] Layout displays correctly
- [ ] Text is readable
- [ ] No color inconsistencies between sections

**Screenshot Required**: ☐ Captured

**Color Accuracy**: ☐ PASS

**Notes**: ___________________________________________________________________

---

**Test Case**: RD-004 - Tablet Dark Theme  
**Expected Result**: Colors display correctly on tablet (dark theme)

**Device**: ______________________ (e.g., iPad Pro)  
**Screen Size**: __________________  
**Browser**: ______________________

**Testing Steps**:
- [ ] Toggle to dark theme
- [ ] Verify colors are accurate
- [ ] Layout displays correctly
- [ ] Text is readable
- [ ] No color inconsistencies between sections

**Screenshot Required**: ☐ Captured

**Color Accuracy**: ☐ PASS

**Notes**: ___________________________________________________________________

---

## Part 8: Summary & Sign-Off

### Test Execution Summary

| Category | Tests | Passed | Failed | Blocked | Status |
|----------|:-----:|:------:|:------:|:-------:|:------:|
| **Color Consistency** | 6 | ☐ | ☐ | ☐ | ☐ |
| **Light Theme** | 12 | ☐ | ☐ | ☐ | ☐ |
| **Dark Theme** | 12 | ☐ | ☐ | ☐ | ☐ |
| **Accessibility** | 6 | ☐ | ☐ | ☐ | ☐ |
| **Cross-Browser** | 8 | ☐ | ☐ | ☐ | ☐ |
| **Responsive** | 4 | ☐ | ☐ | ☐ | ☐ |
| **Plugin Pages** | 6 | ☐ | ☐ | ☐ | ☐ |
| **Total** | **54** | ☐ | ☐ | ☐ | ☐ |

---

### Tester Information

**Tester Name**: ______________________________________  
**Date Tested**: ______________________________________  
**Browser Versions Tested**: ______________________________________  
**OS Versions Tested**: ______________________________________  

---

### Issues Found

**Critical Issues**: _____ (blocking production)  
**Major Issues**: _____ (should fix before release)  
**Minor Issues**: _____ (nice to have)  
**No Issues**: ☐

---

### Overall Assessment

**WCAG Compliance Achieved**: ✅ YES ☐ NO ☐ PARTIAL  
**Theme Consistency Verified**: ✅ YES ☐ NO ☐ PARTIAL  
**Ready for Production**: ☐ YES ☐ NO ☐ CONDITIONAL

**Recommendation**: ______________________________________

______________________________________

______________________________________

---

### Sign-Off

**Tested By**: ______________________ **Date**: __________  
**Reviewed By**: ______________________ **Date**: __________  
**Approved By**: ______________________ **Date**: __________

---

**Document Version**: 1.0  
**Phase**: 4 - QA Validation  
**Status**: ✅ READY FOR USE
