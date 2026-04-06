Terms & Conditions click-through at registration
After account creation (both Google OAuth and email/password), before the Stripe payment screen, add a T&C acceptance step. User must check a box confirming they agree to Terms & Conditions and Privacy Policy, both linked, before the Continue/Pay button activates. Store the acceptance timestamp and user ID in the database

User clicks "Get Started — $99"

They choose Google OAuth or create email/password account

T&C acceptance screen — "By continuing, you agree to our Terms & Conditions and Privacy Policy" with a checkbox they must check before proceeding

Stripe payment

Access granted to platform


--------------------------------------------------------------------------------

Privacy Policy page

HTML: /Users/Local-Data/local-projects/be-unavoidable-modules-staging/Assets/BeUnavoidable_Privacy_Policy 3-25-26.pdf

PDF: /Users/Local-Data/local-projects/be-unavoidable-modules-staging/Assets/privacy.html

--------------------------------------------------------------------------------

Cookie consent banner
In index.html, find this line: <div class="footer-copy">© 2026 Be Unavoidable · Privacy · Terms · Disclaimer</div>

Replace it with: <div class="footer-copy">© 2026 Be Unavoidable · <a href="/privacy.html" style="color:inherit;text-decoration:none;">Privacy Policy</a> · <a href="/terms.html" style="color:inherit;text-decoration:none;">Terms & Conditions</a></div>

--------------------------------------------------------------------------------

