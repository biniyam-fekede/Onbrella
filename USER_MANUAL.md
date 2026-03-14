# On-Brella User Manual

## What is On-Brella?:

On-Brella is a web-based umbrella rental platform that allows users to locate nearby umbrella stations, rent an umbrella, and return it at a station when finished. 


On-Brella is designed to provide a solution for unexpected rain, especially in areas where weather conditions are unpredictable and can change quickly.

---

## Why Use On-Brella?

On-Brella is designed to:

- Give users access to umbrellas without having to own and carry one
- Provide access to umbrellas during unexpected weather
- Allow for flexibility when renting and returning umbrellas at different locations
- Offer a web interface accessible from both mobile and desktop devices

On-Brella supports the following features:

- Interactive map displaying umbrella stations
- Display real-time umbrella and station availability, including number of umbrellas and station capacity
- Umbrella rental and return functionality
- Rental history tracking
- Administrator tools for managing station and umbrella availability

---

## How to install the software:

No local installation is required for end users. On-Brella is a web application that runs in a browser.

### Requirements

- Web browser (Safari, Chrome, Firefox, etc.)
- Internet connection
- Camera access (required for QR code scanning)
- Location access (recommended for map functionality)

---

## How to Run On-Brella

1. Open a supported web browser.
2. Navigate to the On-Brella deployment URL provided by your team or instructor.
3. Allow access to requested permissions (location and camera)

The homepage will load from here. Users can then create an account or log in and begin renting and returning umbrellas.

---

## How to use the software:

Viewing Map and Umbrella Stations:

1. Open the On-Brella homepage.
2. An interactive map will be displayed with all available umbrella stations.
3. Click on a station marker to view:
    a. Number of available umbrellas
    b. Total station capacity
    c. Station location details

Renting an Umbrella:

1. Go to a physical On-Brella station location and locate the QR code displayed at the station.
2. Open the On-Brella web application on your device.
3. Select the “Scan” button on the homepage and use your device camera to scan the station’s QR code.
4. The rental will begin and a timer will display the duration for the active rental.

Returning an Umbrella:

1. Upon reaching the destination, place the umbrella back in a station slot.
2. Once the umbrella is back in the station, the user may press the return button on the active page.
3. When the return is successful, the user will be taken to a thank-you page with the rental summary.

Help, Support, and Notifications:

1. Open **Profile** to access account-related pages.
2. Use **Notifications** to review service announcements published by the admin team.
3. Use **Help & Support** to review FAQs, terms, privacy information, or submit a complaint.

---

## How to report a bug:

If you encounter a bug while using On-Brella, please report it through our [GitHub Issue Tracker](https://github.com/your-org/On-Brella-403-Project/issues).

To submit a bug report:

1. Navigate to the GitHub Issue Tracker link above.
2. Click **New Issue**.
3. Select the **Bug Report** template.
4. Fill out all required fields.
5. Click **Submit** to create the issue.

To help our team solve the issue, include:

- A clear and descriptive title
- A detailed description of the problem
- Step-by-step instructions to reproduce the issue

---

### Known Bugs:

- Camera, geolocation, or backend connectivity issues can interrupt rent/return flows on some devices or local setups.

## Admin Pricing Settings

Administrators can now adjust rental pricing directly from the admin dashboard. In the Inventory tab, there will be a **Pricing** block with fields for the unlock fee and per‑minute charge (in cents). Changes are saved to the backend and take effect immediately for subsequent rentals; the backend uses these values when calculating cost at the end of each rental.

Pricing updates do *not* retroactively alter costs for previously completed rentals. Historical costs displayed in the user history may still be computed locally and therefore may differ if rates change.

