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
    // Navigate directly to the Category Setup screen by modifying the URL
    // This is a workaround to view the screen without going through onboarding
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(3000);
    
    // Since we can't directly navigate to the onboarding screen after completion,
    // let's take a screenshot of the current home screen for reference
    await page.screenshot({ 
      path: '/Users/anyssakayla/Projects/productivity-tracker/home-screen.png',
      fullPage: true 
    });
    console.log('Home screen screenshot saved');
    
    // Now let me create a standalone version of the Category Setup screen
    // to show you what it looks like
    console.log('\nTo see the Category Setup screen design, you would need to:');
    console.log('1. Clear the app data in Expo Go');
    console.log('2. Restart the app');
    console.log('3. Go through onboarding again');
    console.log('\nAlternatively, I can improve the design based on the code.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();