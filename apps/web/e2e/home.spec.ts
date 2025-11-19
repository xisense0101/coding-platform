import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load and display title', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/')

    // Check that the page title is present
    await expect(page).toHaveTitle(/Secure Exam Platform/)

    // Check that the main heading is visible
    const heading = page.getByRole('heading', { name: /Secure Exam Platform/i, level: 1 })
    await expect(heading).toBeVisible()

    // Check that login button is visible
    const loginButton = page.getByRole('link', { name: /Login to Platform/i })
    await expect(loginButton).toBeVisible()
  })

  test('should display key features section', async ({ page }) => {
    await page.goto('/')

    // Check that the features section is present
    const featuresSection = page.locator('#features')
    await expect(featuresSection).toBeVisible()

    // Check for some key feature cards
    await expect(page.getByText(/Coding Challenges/i)).toBeVisible()
    await expect(page.getByText(/Real-time Analytics/i)).toBeVisible()
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/')

    // Check that login link works
    const loginLink = page.getByRole('link', { name: /Login to Platform/i }).first()
    await expect(loginLink).toHaveAttribute('href', '/auth/login')
  })
})
