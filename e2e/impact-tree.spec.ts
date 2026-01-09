import { test, expect, Page } from '@playwright/test';

// Helper to get the main canvas SVG (not icon SVGs)
const getCanvas = (page: Page) => page.locator('main svg[viewBox]').first();

test.describe('Impact Tree Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and clear localStorage before app initializes
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/');

    // Wait for app to be ready
    await page.waitForSelector('h1:has-text("Impact Tree Builder")');

    // Click "New" to start with a fresh, empty tree
    await page.getByRole('button', { name: /New/i }).click();
  });

  test.describe('Page Load', () => {
    test('displays the application header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Impact Tree Builder/i })).toBeVisible();
      await expect(page.getByText('Impact Intelligence Visualization')).toBeVisible();
    });

    test('displays the main toolbar buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /New/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Load/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Help/i })).toBeVisible();
    });

    test('displays the sidebar with tree info and node tools', async ({ page }) => {
      await expect(page.getByText('Tree Information')).toBeVisible();
      await expect(page.getByText('Add Nodes')).toBeVisible();
    });

    test('displays the canvas area', async ({ page }) => {
      // Canvas controls should be visible
      await expect(page.getByRole('button', { name: /Zoom in/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Zoom out/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Reset view/i })).toBeVisible();
    });
  });

  test.describe('Help Dialog', () => {
    test('opens help dialog when clicking Help button', async ({ page }) => {
      await page.getByRole('button', { name: /Help/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Impact Tree Builder Help' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();
    });

    test('opens help dialog with F1 key', async ({ page }) => {
      await page.keyboard.press('F1');

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Impact Tree Builder Help' })).toBeVisible();
    });

    test('closes help dialog with Escape key', async ({ page }) => {
      await page.getByRole('button', { name: /Help/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Theme Toggle', () => {
    test('toggles between light and dark theme', async ({ page }) => {
      // Find the theme toggle button (it has sr-only text "Toggle theme")
      const themeToggle = page.getByRole('button', { name: /Toggle theme/i });
      await expect(themeToggle).toBeVisible();

      // Click to open the theme menu
      await themeToggle.click();

      // Should show theme options
      await expect(page.getByRole('menuitem', { name: /Light/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /Dark/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /System/i })).toBeVisible();
    });
  });

  test.describe('Node Creation via Keyboard Shortcuts', () => {
    test('activates Business Metric mode with B key', async ({ page }) => {
      // Click on the canvas area first to ensure focus isn't in an input
      const canvas = getCanvas(page);
      await canvas.click({ position: { x: 100, y: 100 } });

      await page.keyboard.press('b');

      // The canvas should show copy cursor for add-node mode
      await expect(canvas).toHaveCSS('cursor', 'copy');
    });

    test('activates Product Metric mode with P key', async ({ page }) => {
      const canvas = getCanvas(page);
      await canvas.click({ position: { x: 100, y: 100 } });

      await page.keyboard.press('p');

      await expect(canvas).toHaveCSS('cursor', 'copy');
    });

    test('activates Initiative mode with I key', async ({ page }) => {
      const canvas = getCanvas(page);
      await canvas.click({ position: { x: 100, y: 100 } });

      await page.keyboard.press('i');

      await expect(canvas).toHaveCSS('cursor', 'copy');
    });

    test('activates Select mode with S key', async ({ page }) => {
      // First enter add-node mode
      const canvas = getCanvas(page);
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');
      await expect(canvas).toHaveCSS('cursor', 'copy');

      // Then switch to select mode
      await page.keyboard.press('s');

      await expect(canvas).toHaveCSS('cursor', 'grab');
    });

    test('activates Connect mode with C key', async ({ page }) => {
      const canvas = getCanvas(page);
      await canvas.click({ position: { x: 100, y: 100 } });

      await page.keyboard.press('c');

      // Connect mode shows pointer cursor
      await expect(canvas).toHaveCSS('cursor', 'pointer');
    });

    test('cancels mode with Escape key', async ({ page }) => {
      const canvas = getCanvas(page);
      await canvas.click({ position: { x: 100, y: 100 } });

      // Enter connect mode
      await page.keyboard.press('c');
      await expect(canvas).toHaveCSS('cursor', 'pointer');

      // Press Escape to cancel
      await page.keyboard.press('Escape');

      // Should be back to select mode (grab cursor)
      await expect(canvas).toHaveCSS('cursor', 'grab');
    });
  });

  test.describe('Node Creation via Canvas Click', () => {
    test('creates a Business Metric node', async ({ page }) => {
      const canvas = getCanvas(page);

      // Verify we start with 0 nodes
      await expect(page.getByText('0 nodes')).toBeVisible();

      // First click to focus, then activate mode
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');

      // Click on the canvas to create node
      await canvas.click({ position: { x: 400, y: 300 } });

      // A node should be created
      await expect(page.getByText('1 nodes')).toBeVisible();
      // Check for New Node text in the canvas
      await expect(canvas.locator('[data-node-id]')).toBeVisible();
    });

    test('creates a Product Metric node', async ({ page }) => {
      const canvas = getCanvas(page);

      await expect(page.getByText('0 nodes')).toBeVisible();

      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('p');
      await canvas.click({ position: { x: 400, y: 300 } });

      await expect(page.getByText('1 nodes')).toBeVisible();
    });

    test('creates multiple nodes', async ({ page }) => {
      const canvas = getCanvas(page);

      await expect(page.getByText('0 nodes')).toBeVisible();

      // Create first node
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');
      await canvas.click({ position: { x: 300, y: 200 } });

      await expect(page.getByText('1 nodes')).toBeVisible();

      // Create second node
      await page.keyboard.press('p');
      await canvas.click({ position: { x: 500, y: 400 } });

      // Should now have 2 nodes
      await expect(page.getByText('2 nodes')).toBeVisible();
    });
  });

  test.describe('Node Selection and Properties Panel', () => {
    test('selects a node and shows properties panel', async ({ page }) => {
      const canvas = getCanvas(page);

      // Create a node first
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');
      await canvas.click({ position: { x: 400, y: 300 } });

      // Switch to select mode and click on the node
      await page.keyboard.press('s');

      // Click on the node in the canvas to select it
      await canvas.locator('[data-node-id]').first().click();

      // Properties panel should show node details with heading "Properties"
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
    });

    test('edits node name in properties panel', async ({ page }) => {
      const canvas = getCanvas(page);

      // Create and select a node
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');
      await canvas.click({ position: { x: 400, y: 300 } });

      await page.keyboard.press('s');
      await canvas.locator('[data-node-id]').first().click();

      // Click "Edit Properties" to enter edit mode
      await page.getByRole('button', { name: /Edit Properties/i }).click();

      // Find the name input in the properties panel (right side)
      const propertiesPanel = page.locator('aside').last();
      const nameInput = propertiesPanel.getByLabel(/Name/i);
      await nameInput.clear();
      await nameInput.fill('Revenue Growth');

      // Save the changes
      await page.getByRole('button', { name: /Save/i }).last().click();

      // The new name should appear (use first() since it appears in both canvas and properties)
      await expect(page.getByText('Revenue Growth').first()).toBeVisible();
    });

    test('deletes a node', async ({ page }) => {
      const canvas = getCanvas(page);

      // Create a node
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');
      await canvas.click({ position: { x: 400, y: 300 } });

      await expect(page.getByText('1 nodes')).toBeVisible();

      // Select it
      await page.keyboard.press('s');
      await canvas.locator('[data-node-id]').first().click();

      // Enter edit mode to access delete button
      await page.getByRole('button', { name: /Edit Properties/i }).click();

      // Delete it
      await page.getByRole('button', { name: /Delete Node/i }).click();

      // Node count should be back to 0
      await expect(page.getByText('0 nodes')).toBeVisible();
    });
  });

  test.describe('Relationship Creation', () => {
    test('creates a relationship between two nodes', async ({ page }) => {
      const canvas = getCanvas(page);

      // Create first node
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');
      await canvas.click({ position: { x: 300, y: 200 } });

      // Create second node
      await page.keyboard.press('p');
      await canvas.click({ position: { x: 500, y: 400 } });

      // Verify we have 2 nodes
      await expect(page.getByText('2 nodes')).toBeVisible();

      // Enter connect mode
      await page.keyboard.press('c');

      // Get all nodes and click first, then second
      const nodes = canvas.locator('[data-node-id]');
      await nodes.first().click();
      await nodes.last().click();

      // Verify relationship was created via statistics (0 -> 1)
      // The sidebar should now show 1 relationship
      await expect(page.locator(':text("Relationships") + *:text("1")')).toBeVisible();
    });
  });

  test.describe('Canvas Controls', () => {
    test('zooms in when clicking zoom in button', async ({ page }) => {
      const zoomInBtn = page.getByRole('button', { name: /Zoom in/i });
      await zoomInBtn.click();

      // The button should still be visible after clicking
      await expect(zoomInBtn).toBeVisible();
    });

    test('zooms out when clicking zoom out button', async ({ page }) => {
      const zoomOutBtn = page.getByRole('button', { name: /Zoom out/i });
      await zoomOutBtn.click();

      await expect(zoomOutBtn).toBeVisible();
    });

    test('resets view when clicking reset button', async ({ page }) => {
      const resetBtn = page.getByRole('button', { name: /Reset view/i });
      await resetBtn.click();

      await expect(resetBtn).toBeVisible();
    });

    test('centers view when clicking center button', async ({ page }) => {
      const centerBtn = page.getByRole('button', { name: /Center view/i });
      await centerBtn.click();

      await expect(centerBtn).toBeVisible();
    });
  });

  test.describe('Export Functionality', () => {
    test('opens export dropdown menu', async ({ page }) => {
      await page.getByRole('button', { name: /Export/i }).click();

      await expect(page.getByRole('menuitem', { name: /Export as JSON/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /Export as PNG/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /Export as HTML/i })).toBeVisible();
    });
  });

  test.describe('New Tree', () => {
    test('creates a new tree clearing existing content', async ({ page }) => {
      const canvas = getCanvas(page);

      // Create a node first
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('b');
      await canvas.click({ position: { x: 400, y: 300 } });

      // Verify node exists
      await expect(page.getByText('1 nodes')).toBeVisible();

      // Click New button
      await page.getByRole('button', { name: /New/i }).click();

      // Node should be cleared
      await expect(page.getByText('0 nodes')).toBeVisible();
    });
  });

  test.describe('Tree Info', () => {
    test('displays default tree name for new tree', async ({ page }) => {
      // Default tree name for a new tree should be "New Impact Tree"
      const treeNameInput = page.locator('#treeName');
      await expect(treeNameInput).toHaveValue('New Impact Tree');
    });

    test('allows editing tree name', async ({ page }) => {
      const treeNameInput = page.locator('#treeName');
      await treeNameInput.clear();
      await treeNameInput.fill('Q1 Revenue Impact');

      await expect(treeNameInput).toHaveValue('Q1 Revenue Impact');
    });
  });
});
