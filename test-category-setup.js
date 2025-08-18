import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:8081');
    console.log('Navigated to app');
    
    // Wait for app to fully load
    await page.waitForTimeout(5000);
    
    // Take a screenshot of current state
    await page.screenshot({ 
      path: '/Users/anyssakayla/Projects/productivity-tracker/current-state.png',
      fullPage: true 
    });
    console.log('Screenshot of current state saved');

    // Try to click through to category setup if possible
    try {
      // Check if we're on Welcome screen
      if (await page.locator('text="Get Started"').isVisible()) {
        console.log('Found Get Started button, clicking...');
        await page.click('text="Get Started"');
        await page.waitForTimeout(2000);
        
        // Fill profile
        await page.fill('input[placeholder="Enter your name"]', 'Test User');
        await page.fill('input[placeholder="your@email.com"]', 'test@example.com');
        await page.click('text="Continue"');
        await page.waitForTimeout(2000);
        
        // Select focus
        await page.click('text="Work"');
        await page.waitForTimeout(1000);
        await page.click('text="Next: Add Categories"');
        await page.waitForTimeout(2000);
        
        // Take screenshot of Category Setup
        await page.screenshot({ 
          path: '/Users/anyssakayla/Projects/productivity-tracker/category-setup-screenshot.png',
          fullPage: true 
        });
        console.log('Category Setup screenshot saved');
      } else {
        console.log('Not on Welcome screen, app may already be onboarded');
      }
    } catch (error) {
      console.log('Error navigating:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();