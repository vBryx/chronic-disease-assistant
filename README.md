# Chronic Disease Assistant

Follow these steps from start to finish. Use the Chrome section or the Edge section.

## 1. Install Tampermonkey

### Google Chrome

1. Open the [Tampermonkey page in the Chrome Web Store](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo).

![Chrome Web Store with Add to Chrome highlighted](docs/images/install/chrome/01-open-store.png)

2. Select **Add to Chrome**.
3. Select **Add extension** in the confirmation box.

![Chrome confirmation box with Add extension highlighted](docs/images/install/chrome/02-confirm-add-extension.png)

4. Select the Extensions button near the address bar.
5. Select the pin beside **Tampermonkey**.

![Chrome Extensions menu with the Tampermonkey pin highlighted](docs/images/install/chrome/03-pin-tampermonkey.png)

6. Right-click the Tampermonkey icon.
7. Select **Manage extension**.
8. Find **Allow User Scripts**.

![Chrome extension settings with Allow User Scripts off](docs/images/install/chrome/04-allow-user-scripts-off.png)

9. Turn on **Allow User Scripts**.

![Chrome extension settings with Allow User Scripts enabled](docs/images/install/chrome/05-allow-user-scripts-on.png)

**Expected result:** The Tampermonkey icon stays beside the address bar. **Allow User Scripts** is on.

### Microsoft Edge

1. Open the [Tampermonkey page in Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd).

![Microsoft Edge Add-ons page with Get highlighted](docs/images/install/edge/01-open-store.png)

2. Select **Get**.
3. Select **Add extension** in the confirmation box.

![Edge confirmation box with Add extension highlighted](docs/images/install/edge/02-confirm-add-extension.png)

4. Select the Extensions button near the address bar.
5. Select the eye beside **Tampermonkey**.

![Edge Extensions menu with the Tampermonkey eye highlighted](docs/images/install/edge/03-pin-tampermonkey.png)

6. Right-click the Tampermonkey icon.
7. Select **Manage extension**.
8. Find **Allow User Scripts**.

![Edge extension settings with Allow User Scripts off](docs/images/install/edge/04-allow-user-scripts-off.png)

9. Turn on **Allow User Scripts**.

![Edge extension settings with Allow User Scripts enabled](docs/images/install/edge/05-allow-user-scripts-on.png)

**Expected result:** The Tampermonkey icon stays beside the address bar. **Allow User Scripts** is on.

> If **Allow User Scripts** does not appear, open the browser Extensions page and turn on **Developer mode**. This follows [Tampermonkey FAQ Q209](https://www.tampermonkey.net/faq.php?q=Q209).

## 2. Install Chronic Disease Assistant

Use the same steps in Chrome or Edge.

1. Select **[Install Chronic Disease Assistant](https://raw.githubusercontent.com/vBryx/chronic-disease-assistant/main/chronic-disease-assistant.user.js)**.

2. Check that the page says **Chronic Disease Assistant**.
3. Select **Install**.

Chrome:

![Tampermonkey installation page in Chrome with Install highlighted](docs/images/install/chrome/07-install-chronic-assistant.png)

Edge:

![Tampermonkey installation page in Edge with Install highlighted](docs/images/install/edge/07-install-chronic-assistant.png)

4. Select the Tampermonkey icon.
5. Select **Dashboard**.
6. Find **Chronic Disease Assistant** in the list.
7. Check that its switch is on.

Chrome:

![Tampermonkey Dashboard in Chrome with Chronic Disease Assistant enabled](docs/images/install/chrome/08-dashboard-enabled.png)

Edge:

![Tampermonkey Dashboard in Edge with Chronic Disease Assistant enabled](docs/images/install/edge/08-dashboard-enabled.png)

**Expected result:** The Dashboard shows **Chronic Disease Assistant** with a green enabled switch.

> The installation address will work after the public page goes live.

## 3. See the Assistant working in Raqeem

1. Close the Tampermonkey Dashboard.
2. Reload any open Raqeem tab.
3. Sign in to Raqeem if needed.
4. Open one patient record.
5. Wait for the grey **LOADING…** cells to finish.

![The Assistant reading a fictitious patient record](docs/images/strip-loading.png)

6. Look below the patient banner.

![Chronic Disease Assistant visible below a fictitious patient banner](docs/images/strip-follow-up.png)

**Expected result:** A **SCREENING & FOLLOW-UP** strip shows DM, Dyslipidemia, Colon cancer, and CKD.

A patient with due screening can look like this:

![Due screening for a fictitious patient](docs/images/strip-screening.png)

The strip shows screening, follow-up, pending results, repeat tests, or unavailable records. Select **Details** for care gaps, results, vitals, medicines, and calculators.

## 4. Use it during the visit

1. Read the four pathway cells.
2. Select a cell to see its reason.
3. Select **Details** to review the supporting information.
4. Select **↻** after a new result or order.
5. Use **Add screening codes** only after checking the suggested codes.
6. Confirm the message before the Assistant adds a code.

**Expected result:** The Assistant supports the review without hiding uncertainty. Unread information never appears as clear or complete.

See [Using the Assistant](docs/using.md) for the daily steps. See [Clinical meanings](docs/meanings.md) for every state and rule.

## Optional: remove the old Raqeem Screening Assistant

Use this section only when the Dashboard contains **Raqeem Screening Assistant**.

The two assistants must not run together. The Assistant then shows this notice:

![Notice asking the doctor to remove the old Raqeem Screening Assistant](docs/images/old-script-notice.png)

### Chrome

1. Open the Tampermonkey Dashboard.
2. Find **Raqeem Screening Assistant**.
3. Select its delete button.

![Chrome Dashboard with the old assistant delete button highlighted](docs/images/install/chrome/09-delete-old-script.png)

4. Confirm that only **Chronic Disease Assistant** remains.

![Chrome Dashboard with only Chronic Disease Assistant](docs/images/install/chrome/10-old-script-removed.png)

### Edge

1. Open the Tampermonkey Dashboard.
2. Find **Raqeem Screening Assistant**.
3. Select its delete button.

![Edge Dashboard with the old assistant delete button highlighted](docs/images/install/edge/09-delete-old-script.png)

4. Confirm that only **Chronic Disease Assistant** remains.

![Edge Dashboard with only Chronic Disease Assistant](docs/images/install/edge/10-old-script-removed.png)

5. Reload Raqeem.

**Expected result:** The notice disappears. The full **SCREENING & FOLLOW-UP** strip appears.

## Updates

Tampermonkey checks for new versions automatically.

To check now:

1. Select the Tampermonkey icon.
2. Select the highlighted update option.
3. Reload Raqeem after an update.

Chrome:

![Chrome Tampermonkey menu with the update check highlighted](docs/images/install/chrome/11-check-for-updates.png)

Edge:

![Edge Tampermonkey menu with the update check highlighted](docs/images/install/edge/11-check-for-updates.png)

**Expected result:** Tampermonkey reports whether an update is available.

## Safety and privacy

- The Assistant reads only the open patient's information in Raqeem.
- It sends no patient information to another website.
- It adds screening codes only after you confirm.
- It checks the Diagnosis list again after adding a code.
- It keeps a complete reading in the current tab for up to 10 minutes.
- Closing the tab removes that saved reading.
- Calculator links open only when you select them.
- FRAX receives no patient information. Enter its values yourself.

Do not include patient information in a problem report. Do not send Raqeem screenshots.

## Clinical limits

- This is a support tool. It does not diagnose and does not replace clinical judgement.
- Colon cancer screening uses FIT because colonoscopy results are not available to the Assistant.
- PREVENT comes from United States data and is not validated for Saudi patients.
- Saudi FRAX opens the official calculator. The Assistant does not calculate the FRAX score.
- The doctor enters smoking status for PREVENT and FRAX. The Assistant does not save it.
- Information recorded outside Raqeem is not available to the Assistant.
- A missing or failed reading is shown clearly. Select **↻** to try again.

## Report a problem

1. Open the [problem report form](https://github.com/vBryx/chronic-disease-assistant/issues/new?template=problem.md).
2. State your browser and Assistant version.
3. Name the cell or Details tab.
4. Copy the exact message that looked wrong.
5. Describe the clinical situation without any patient identifiers.

Never include names, record numbers, national or iqama numbers, birth dates, phone numbers, or Raqeem screenshots.

## More help

- [Using the Assistant](docs/using.md)
- [Clinical meanings](docs/meanings.md)
- [What changed](CHANGELOG.md)

All Raqeem images in this guide use fictitious information.
