import { chromium } from 'playwright';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    
    // Clear app data by evaluating JavaScript in the page context
    await page.evaluate(() => {
      // Clear AsyncStorage to reset onboarding
      if (window.localStorage) {
        window.localStorage.clear();
      }
    });
    
    // Reload the page
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Now navigate through onboarding
    console.log('Looking for Get Started button...');
    const getStarted = await page.locator('text="Get Started"');
    if (await getStarted.isVisible()) {
      await getStarted.click();
      console.log('Clicked Get Started');
      await page.waitForTimeout(1000);
      
      // Profile setup
      console.log('Filling profile...');
      await page.fill('input[placeholder="Enter your name"]', 'Test User');
      await page.fill('input[placeholder="your@email.com"]', 'test@example.com');
      await page.click('text="Continue"');
      await page.waitForTimeout(1000);
      
      // Focus selection
      console.log('Selecting focus...');
      await page.click('text="Work"');
      await page.waitForTimeout(500);
      await page.click('text="Next: Add Categories"');
      await page.waitForTimeout(2000);
      
      // Take screenshot of Category Setup
      await page.screenshot({ 
        path: '/Users/anyssakayla/Projects/productivity-tracker/category-setup-current.png',
        fullPage: true 
      });
      console.log('Category Setup screenshot saved to category-setup-current.png');
    } else {
      // Just take a screenshot of whatever is showing
      await page.screenshot({ 
        path: '/Users/anyssakayla/Projects/productivity-tracker/current-screen.png',
        fullPage: true 
      });
      console.log('Current screen screenshot saved');
    }
    
  } catch (error) {
    console.error('Error:', error);
    // Take error screenshot
    await page.screenshot({ 
      path: '/Users/anyssakayla/Projects/productivity-tracker/error-screen.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();