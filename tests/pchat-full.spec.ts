
import {
  test,
  expect,
  Page,
  BrowserContext,
} from '@playwright/test';

import { argosScreenshot } from '@argos-ci/playwright';

const BASE_URL = 'http://127.0.0.1:5173';

const USERS = {
  superadmin: {
    email: 'superadmin@mail.com',
    password: 'superadmin@1234',
    username: 'superadmin',
  },

  admin: {
    email: 'admin@mail.com',
    password: 'Admin@1234',
    username: 'admin',
  },
};

// ==========================================
// WEBSOCKET MONITORING
// ==========================================


function monitorWebSocket(
  page: Page,
  username: string
) {
  page.on('websocket', (ws) => {
    console.log(
      `[${username}] WebSocket connected: ${ws.url().split('?')[0]}`
    );

    ws.on('framesent', (event) => {
      const payload = String(event.payload);

      if (
        payload.includes('Authorization:') ||
        payload.includes('Bearer ')
      ) {
        console.log(`[${username}] WS SENT: CONNECT`);
        return;
      }

      console.log(
        `[${username}] WS SENT:`,
        payload.slice(0, 500)
      );
    });

    ws.on('framereceived', (event) => {
      const payload = String(event.payload);

      console.log(
        `[${username}] WS RECEIVED:`,
        payload.slice(0, 500)
      );
    });

    ws.on('close', () => {
      console.log(
        `[${username}] WebSocket CLOSED`
      );
    });
  });
}


// ==========================================
// LOGIN HELPER
// ==========================================

async function login(
  page: Page,
  email: string,
  password: string
) {
  await page.goto(BASE_URL);

  const emailInput = page.locator(
    'input[type="email"]'
  );

  const passwordInput = page.locator(
    'input[type="password"]'
  );

  await expect(emailInput).toBeVisible({
    timeout: 15000,
  });

  await emailInput.fill(email);
  await passwordInput.fill(password);

  await page.getByRole('button', {
    name: /sign in/i,
  }).click();

  // Wait for login form to disappear.
  await expect(passwordInput).toHaveCount(0, {
    timeout: 20000,
  });

  console.log(`LOGIN SUCCESS: ${email}`);
}

// ==========================================
// CREATE OR SELECT CONVERSATION
// ==========================================

async function createOrSelectConversation(
  page: Page,
  targetEmail: string,
  searchTerm: string
) {
  const addButton = page.locator(
    'button:has(.anticon-plus), button:has-text("+")'
  ).first();

  await expect(addButton).toBeVisible({
    timeout: 15000,
  });

  await addButton.click();

  const modal = page.locator('.ant-modal');

  await expect(modal).toBeVisible({
    timeout: 10000,
  });

  const searchInput = modal.locator('input').first();

  await searchInput.fill(searchTerm);

  const targetUser = modal.getByText(targetEmail, {
    exact: true,
  }).last();

  await expect(targetUser).toBeVisible({
    timeout: 15000,
  });

  await targetUser.click();

  await expect(modal).toBeHidden({
    timeout: 10000,
  });

  console.log(
    `CONVERSATION SELECTED: ${targetEmail}`
  );
}

// ==========================================
// OPEN CONVERSATION
// ==========================================

async function openConversation(
  page: Page,
  username: string
) {
  // The sidebar displays usernames rather than emails.
  const conversation = page.getByRole('heading', {
    name: username,
    exact: true,
  });

  await expect(conversation).toBeVisible({
    timeout: 15000,
  });

  await conversation.click();

  const messageInput = page.getByPlaceholder(
    'Type a message...'
  );

  await expect(messageInput).toBeVisible({
    timeout: 15000,
  });

  console.log(
    `CHAT OPENED: ${username}`
  );

  return messageInput;
}

// ==========================================
// SEND MESSAGE
// ==========================================


async function sendMessage(
  page: Page,
  message: string
) {
  const messageInput = page.getByPlaceholder(
    'Type a message...'
  );

  await expect(messageInput).toBeVisible();

  await messageInput.fill(message);

  const sendButton = page.getByRole('button', {
    name: /send/i,
  });

  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  // IMPORTANT: Search only inside the chat window.
  const messageInChat = page
    .getByRole('main')
    .getByText(message, { exact: true });

  await expect(messageInChat).toBeVisible({
    timeout: 20000,
  });

  console.log(`MESSAGE SENT: ${message}`);
}


// ==========================================
// VERIFY RECEIVED MESSAGE
// ==========================================


async function verifyReceivedMessage(
  page: Page,
  message: string
) {
  const messageInChat = page
    .getByRole('main')
    .getByText(message, { exact: true });

  await expect(messageInChat).toBeVisible({
    timeout: 20000,
  });

  console.log(`MESSAGE RECEIVED: ${message}`);
}
// ==========================================
// TEST SUITE
// ==========================================

test.describe(
  'pChat - Bidirectional Real-Time WebSocket Messaging',
  () => {

    let contextA: BrowserContext;
    let contextB: BrowserContext;

    let pageA: Page;
    let pageB: Page;

    // ==========================================
    // BEFORE EACH
    // ==========================================

    test.beforeEach(async ({ browser }) => {

      // Separate contexts = separate users.
      contextA = await browser.newContext();

      contextB = await browser.newContext();

      pageA = await contextA.newPage();

      pageB = await contextB.newPage();

      // Monitor WebSocket traffic.
      // Register before login so early connections are captured.
      monitorWebSocket(
        pageA,
        'SUPERADMIN'
      );

      monitorWebSocket(
        pageB,
        'ADMIN'
      );
    });

    // ==========================================
    // AFTER EACH
    // ==========================================

    test.afterEach(async () => {

      await contextA?.close();

      await contextB?.close();

    });

    // ==========================================
    // MAIN TEST
    // ==========================================

    test(
      'Superadmin and Admin exchange messages in real time',
      async () => {

        // ==========================================
        // STEP 1: LOGIN BOTH USERS
        // ==========================================

        await Promise.all([

          login(
            pageA,
            USERS.superadmin.email,
            USERS.superadmin.password
          ),

          login(
            pageB,
            USERS.admin.email,
            USERS.admin.password
          ),

        ]);

        console.log(
          'BOTH USERS LOGGED IN'
        );

        // ==========================================
        // STEP 2: WAIT FOR APP CONNECTIONS
        // ==========================================

        await expect(
          pageA.getByPlaceholder(
            'Search conversations'
          )
        ).toBeVisible();

        await expect(
          pageB.getByPlaceholder(
            'Search conversations'
          )
        ).toBeVisible();

        console.log(
          'BOTH CHAT APPLICATIONS LOADED'
        );

        // ==========================================
        // STEP 3: SUPERADMIN SELECTS ADMIN
        // ==========================================

        await createOrSelectConversation(
          pageA,
          USERS.admin.email,
          'admin'
        );

        // ==========================================
        // STEP 4: ADMIN SELECTS SUPERADMIN
        // ==========================================

        await createOrSelectConversation(
          pageB,
          USERS.superadmin.email,
          'superadmin'
        );

        // ==========================================
        // STEP 5: OPEN BOTH CHAT WINDOWS
        // ==========================================

        const messageInputA =
          await openConversation(
            pageA,
            USERS.admin.username
          );

        const messageInputB =
          await openConversation(
            pageB,
            USERS.superadmin.username
          );

        console.log(
          'BOTH CHAT WINDOWS ARE OPEN'
        );

        // ==========================================
        // STEP 6: SUPERADMIN SENDS MESSAGE
        // ==========================================

        const messageFromSuperadmin =
          `Hello Admin! From Superadmin ${Date.now()}`;

        await sendMessage(
          pageA,
          messageFromSuperadmin
        );

        // Verify real-time delivery to Admin.
        await verifyReceivedMessage(
          pageB,
          messageFromSuperadmin
        );

        console.log(
          'PASS: SUPERADMIN -> ADMIN'
        );

        // ==========================================
        // STEP 7: ADMIN REPLIES
        // ==========================================

        const messageFromAdmin =
          `Hello Superadmin! Reply from Admin ${Date.now()}`;

        await sendMessage(
          pageB,
          messageFromAdmin
        );

        // Verify real-time delivery to Superadmin.
        await verifyReceivedMessage(
          pageA,
          messageFromAdmin
        );

        console.log(
          'PASS: ADMIN -> SUPERADMIN'
        );

        // ==========================================
        // STEP 8: FINAL VERIFICATION
        // ==========================================

        // Superadmin sees both messages.
        await verifyReceivedMessage(
          pageA,
          messageFromSuperadmin
        );

        await verifyReceivedMessage(
          pageA,
          messageFromAdmin
        );

        // Admin sees both messages.
        await verifyReceivedMessage(
          pageB,
          messageFromSuperadmin
        );

        await verifyReceivedMessage(
          pageB,
          messageFromAdmin
        );

        console.log(
          'PASS: BOTH USERS CAN SEE BOTH MESSAGES'
        );

        // ==========================================
        // STEP 9: ARGOS SCREENSHOTS
        // ==========================================

        await argosScreenshot(
          pageA,
          'superadmin-chat-bidirectional'
        );

        await argosScreenshot(
          pageB,
          'admin-chat-bidirectional'
        );

        console.log(
          'ARGOS SCREENSHOTS CAPTURED'
        );

        // ==========================================
        // TEST COMPLETE
        // ==========================================

        console.log(
          '===================================='
        );

        console.log(
          'BIDIRECTIONAL CHAT TEST PASSED'
        );

        console.log(
          'SUPERADMIN -> ADMIN: SUCCESS'
        );

        console.log(
          'ADMIN -> SUPERADMIN: SUCCESS'
        );

        console.log(
          'REAL-TIME DELIVERY: SUCCESS'
        );

        console.log(
          '===================================='
        );

      }
    );

  }
);
