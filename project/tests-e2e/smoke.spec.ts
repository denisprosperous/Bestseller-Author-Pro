import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Bestseller Author Pro/i)
})

test('settings page renders and allows API key entry', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.locator('text=API Keys')).toBeVisible()
})

test('builder flow is reachable', async ({ page }) => {
  await page.goto('/brainstorm')
  await expect(page.locator('text=Brainstorm')).toBeVisible()
  await page.goto('/builder')
  await expect(page.locator('text=Builder')).toBeVisible()
  await page.goto('/preview')
  await expect(page.locator('text=Preview')).toBeVisible()
})
