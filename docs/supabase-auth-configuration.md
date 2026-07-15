# Supabase Auth configuration

The application environment and the Supabase Dashboard must use the same public AIT origin. Do not use the retired Tasko deployment URL.

## Application environment

Set these variables in local development and in the deployment environment:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
NEXT_PUBLIC_SITE_URL=https://your-ait-domain.example
```

`NEXT_PUBLIC_SITE_URL` must be an absolute HTTP(S) origin without a path. Local browser sessions and Vercel previews use their current browser origin so that their PKCE verifier and callback stay on the same origin.

## Dashboard URL Configuration

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to the exact production value of `NEXT_PUBLIC_SITE_URL`, for example `https://your-ait-domain.example`.
2. Add the exact production signup callback to **Redirect URLs**:

   ```text
   https://your-ait-domain.example/auth/callback?next=%2Flogin%3Fconfirmed%3D1
   ```

3. Add the exact production password-recovery callback:

   ```text
   https://your-ait-domain.example/auth/callback?flow=recovery
   ```

4. Add both localhost callbacks for local testing:

   ```text
   http://localhost:3000/auth/callback?next=%2Flogin%3Fconfirmed%3D1
   http://localhost:3000/auth/callback?flow=recovery
   ```

5. For each Vercel preview that will send authentication email, add the corresponding preview callbacks. Supabase supports a Vercel wildcard such as `https://*-YOUR-VERCEL-SCOPE.vercel.app/**`, but exact production URLs are safer and should remain exact.

Supabase rejects a `redirectTo` value that is not on this allow list and can fall back to the Dashboard Site URL instead.

## Password-recovery email template

The standard Supabase PKCE recovery link must be opened in the same browser/device that requested it because that browser holds the PKCE verifier.

The callback also supports a server-verified recovery `token_hash`. To enable cross-device recovery, manually edit **Supabase Dashboard → Authentication → Email Templates → Reset password** and set the reset button/link target to exactly:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>
```

Keep the rest of the email design as desired. This template sends the token hash directly to the application's server callback, which calls `verifyOtp({ token_hash, type: "recovery" })`, stores the returned session in cookies, removes the token from the next browser URL, and redirects to `/update-password`.

Until this template change is saved and a newly generated recovery email is tested, cross-device recovery must be treated as unsupported. Existing recovery emails are not rewritten by a template change.

Do not add a Supabase service-role key to this frontend application.
