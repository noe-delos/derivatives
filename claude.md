Hi claude, here was the original prompt of this project : 
Hi claude,Today we'll be making a Next.js project called "Derivatives" of a platform with an authentication system, backoffice, supabase database.
So, in this app, we have regular users, moderators and administrators. Moderators and administrators have access to the backoffice but not the regular users.
The app is both in french and english, you'll define a react-i18n for that, by default in french.The app is composed of a dashboard display with a sidebar and a header. Before that there is an authentication system composed of signin, signup, forgot password and reset password pages.The goal of this is app is a finance courses learning platform. So through this app we have a LMS in the backoffice that moderators and administrators can manage.Here is the idea, a course has :
* a title
* A description (from a tiptap markdown layout)
* A category
* a picture url 
* notes (same as description but it'll regard other info such as requirements and what not))
* A list of modules 
* Reviews
* note
* a difficulty (textual free value)

Now what is a module :

* So courses have a list of them that can be managed by order. 
* A module is basically a chapter. It can have a list of the following content : A video / A file or a quizz. So they define a module name, and the content inside of it. 
* For quizzes, in the backoffice there is a quizzes pages where moderators and admins can create some, modify, delete and assign them to courses. A quizz has a list of question. They can be either choice question with one right answer or a textual question that asks the user to input text. Quizzes has timer time defined (if null then no timer)), at the end of the quizz users get their note, but if the quizz has at least one texual question then it becomes a quizz that needs correction from a moderator. So in the backoffice moderators would have a page to correct these quizzes.
* So in the backoffice there is of course a page that listes all of the courses, they are ordered, meaning they appear in the app users listes in a specific order, moderators can modify this order
* Of course there is a create course page. Where they define the modules, title, ordereing, they can create a quizz within the create course page. 
* A course has associated ressources (basically one file module is considered a ressource)
* The backoffice contains other pages such as users tables, subscriptions list page, one statistics page.
* moderators can upload multiple files for a module.
* an estimated time of completion (in minutes), Cannot be null (required), expect for video typed modules as we have the video duration. 
So there is a concept of subscription for user, but it's not a monthly subscription at all. It's a one time payment system, they can choose between two offers and they're for life, one for 800$ and the other 2000$. However, students can signup for free. However they'll have all courses not accessible (locked) except the first one ! Another concept, users "register" to a course, it's simple one click action available subcrtiption users to courses that they need to do before accessing to a course content, it's a simple table where we can track what courses students register too.
Regarding course, we track the exact progress of students, meaning they mark if they finished a module we keep the exact progress related to that course. Within that course the users would click on Next to go to the following module and that would mark the module as finished. We keep track of the progressions for each courses.We'd have a notification system table. Telling users if their quizz got corrected, general information, day streak. Also, we'd have a goal system. When users arrive the first time on the platform, there is a dialog openning asking them to define in a input in one setence what they're looking to achieve through the platform, then below a button that will generate maximum 5 tasks to complete n the platform to achieve that, they can remove the tasks, add manually some or modify, then click on submit and it will save that in table. The goal of this is to sometimes ask them if they've achieve their goal. In the table we'd have a date to ask them again on the platform. So if one day they login, it asks them if they've achieve one of their goal, they would click on a done button to mark them as complete, and then in the table it'll put the "ask_again_date" to like 2 days later. Layout and visual elements :

* As mentionned before, the main app must be composed of a sidebar (collapsible), with the logo on top. The nav items are : Modules title, below with some padding left the list of all of the modules (max height and scrollable). Then below, communauté title, Avis item, and below it Discord item. Then next tile is General, below two items, Profile and settings (within Profile, change the user name, firstname, display its information and profile picture that he can change.Within the parameters it's only to change email or reset password. Then below on the bottom it's just a "progression" clickable item that does nothing for now.
* A header, then next to the sidebar there will be a header, with on the right end a profile avatar with popover, with signout, profile settings. On the left of that avatar the notification popover 
* Main dashboard page. on the top left, Bienvenue sur Derivatives, below that a big video (mp4 from the public folder called /presentation.mp4), then on the right of that video a column with a day streak (1, 3, 7, 14). Below this row, is a row with all of the courses (it's scrollable on X and have a right trasnparaent effect on the right. It's clickable and shows the courses in order with their picture).
* Below that would be the user achievements : They are marked completed or not : 🎓 Premier module terminé / 📈 50% formation complétée / Actif communauté (if he publied a review).
* Then below that the user objectives (he can mark or unmark them and do CRUD operations on them.
* We'll implement the Avis page later on and most of the other pages later on, we'll first focus on the database, and the course.
* Important part, what happens when we click on the course. Well, the sidebar disapears, the header stays, and the course show. The interface of a cours is the following : its image in big on top left normal, on the right of it is a column of all of the modules with a progression and marking the ones completed. Below the course image are tabs infroamtion / avis. Information showing the description and notes, and avis showing the reviews, of course, above the image, is the title, difficulty and category. However if the course hasn't been registered everything is disabled and locked, on the image it shows a button "Register". Then on fialog comfrim unluck everything, There would be a button "Démarrer somewhere" and finish course. Démarer button will launch a new view. In this new view, there is a sidebar on the left with all of the modules listed and their respective content. on the right is the actual content showing, either video, quizz or file. For quizz the rendering of the quizz appears, before launching it it shows a card with the quizz title descirption time estimated and launch button an the number of times the user passed it before.
* For the backoffice, it has his own sidebar and header. TECHNICAL CONSTRAINTS : Here are the technical constraints, of this project you need to follow them.- For anything SQL related such as tables and whatnot, you will create a database.sql file containing all of the SQL definitions of our application (it's to keep track of the structure), for every new things we put in the database you'll modify this file and give me the sepcific migrations to run.
* For all of the documents / videos, we'll store them in the supabase storage. For the uploads in the frontend, you need to do it from a 'use client' file and directly from the layout file using a supabase client object that will upload them to the storage. 
* Regarding icons you will ALWAYS use iconify icons : import { Icon } from "@iconify/react";Then use Icon component with icon name as icon parameter:jsx<Icon icon="mdi-light:home" />
You will use a nextjs technology and make page.tsx and layout.tsx always run in 'use server' and call their layout defined in another folders of components. The project uses shadcn.in this project we'll use React query tanstack to make the fetches.
THE LAYOUT MUST BE ABSOLUTELY WELL RESPONSIVE FOR MOBILE (this is a very important thing, so in mobile layout the sidebar becomes an hamburger menu and content should be responsive for everything. Users use them using their mobile a lot.You'll make buckets for the content of course (mp4 videos of the courses or attached files).
You'll make a users table in the public schema and the id the auth.users table from supabase, users that get signedup or created automatically populate this public.users table, cause in it we'll have infromation such as porfile pic url, names, phone number...Finally regarding supabase auth, we'll implement a classic next server auth. It uses a server client, normal client and utilize middlewares to define which pages are accessible and not if authanticated and vice versa. You will use these supabase client across the app for the fetches you need. So one client called the useSupabase can be used in the 'use client' files while the other only in the 'use server' files, simple as that.Here is the tutorial you follow strickly : 
Setting up Server-Side Auth for Next.js

Next.js comes in two flavors: the App Router and the Pages Router. You can set up Server-Side Auth with either strategy. You can even use both in the same application.


App Router

Pages Router

Hybrid router strategies
1
Install Supabase packages
Install the @supabase/supabase-js package and the helper @supabase/ssr package.

npm install @supabase/supabase-js @supabase/ssr
2
Set up environment variables
Create a .env.local file in your project root directory.

Fill in your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY:

Project URL
ks / Shannen
https://frljvvbfjosioxomtofy.supabase.co

Anon key
ks / Shannen
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybGp2dmJmam9zaW94b210b2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzgxOTcsImV4cCI6MjA2NDM1NDE5N30.xidhHS_-cc6EDIgcyq-grlzfngP46op8S2ZAnR6SsjU


.env.local
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
3
Write utility functions to create Supabase clients
To access Supabase from your Next.js app, you need 2 types of Supabase clients:

Client Component client - To access Supabase from Client Components, which run in the browser.
Server Component client - To access Supabase from Server Components, Server Actions, and Route Handlers, which run only on the server.
Create a utils/supabase folder with a file for each type of client. Then copy the utility functions for each client type.


What does the `cookies` object do?

Do I need to create a new client for every route?
utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

utils/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
4
Hook up middleware
Create a middleware.ts file at the root of your project, or inside the ./src folder if you are using one.

Since Server Components can't write cookies, you need middleware to refresh expired Auth tokens and store them.

The middleware is responsible for:

Refreshing the Auth token (by calling supabase.auth.getUser).
Passing the refreshed Auth token to Server Components, so they don't attempt to refresh the same token themselves. This is accomplished with request.cookies.set.
Passing the refreshed Auth token to the browser, so it replaces the old token. This is accomplished with response.cookies.set.
Copy the middleware code for your app.

Add a matcher so the middleware doesn't run on routes that don't access Supabase.

Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.

Always use supabase.auth.getUser() to protect pages and user data.

Never trust supabase.auth.getSession() inside server code such as middleware. It isn't guaranteed to revalidate the Auth token.

It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.

utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

middleware.ts

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
5
Create a login page
Create a login page for your app. Use a Server Action to call the Supabase signup function.

Since Supabase is being called from an Action, use the client defined in @/utils/supabase/server.ts.

Note that cookies is called before any calls to Supabase, which opts fetch calls out of Next.js's caching. This is important for authenticated data fetches, to ensure that users get access only to their own data.

See the Next.js docs to learn more about opting out of data caching.

app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
app/error/page.tsx
'use client'

export default function ErrorPage() {
  return <p>Sorry, something went wrong</p>
}
app/login/page.tsx

import { login, signup } from './actions'
export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
6
Change the Auth confirmation path
If you have email confirmation turned on (the default), a new user will receive an email confirmation after signing up.

Change the email template to support a server-side authentication flow.

Go to the Auth templates page in your dashboard. In the Confirm signup template, change {{ .ConfirmationURL }} to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email.

7
Create a route handler for Auth confirmation
Create a Route Handler for auth/confirm. When a user clicks their confirmation email link, exchange their secure code for an Auth token.

Since this is a Router Handler, use the Supabase client from @/utils/supabase/server.ts.


app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next)
    }
  }
  // redirect the user to an error page with some instructions
  redirect('/error')
}
8
Access user info from Server Component
Server Components can read cookies, so you can get the Auth status and user info.

Since you're calling Supabase from a Server Component, use the client created in @/utils/supabase/server.ts.

Create a private page that users can only access if they're logged in. The page displays their email.

Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.

Always use supabase.auth.getUser() to protect pages and user data.

Never trust supabase.auth.getSession() inside Server Components. It isn't guaranteed to revalidate the Auth token.

It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.


app/private/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
export default async function PrivatePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  return <p>Hello {data.user.email}</p>
}
Congratulations#
For images that use a web hostel url you will always use <img element, but for images within the public folder, you are authorised to use Next <Image element
ALWAYS USE PNPM FOR COMMANDS. The next project is already setup. Also you don’t need to run build or lint check, I do that myself.
Here is the sup abase keys : 
Annonce key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVneXd2a2FzYndqY3pmbnNld3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMDIxMjEsImV4cCI6MjA2NzY3ODEyMX0.GA4X8JMwQFzl20TKY3zwbjgNnkNcHYUpTFGrn_8fvvosupabase url : https://ugywvkasbwjczfnsewpq.supabase.co
