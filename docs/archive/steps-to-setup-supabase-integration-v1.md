Read all lnks before starting

## What I started doing to  Enable Supabase Integration in Cloudflare Workers

i was following this doucmentation: https://supabase.com/partners/integrations/cloudflare-workers

I Started by heading to the Cloudflare Dashboard, go to the Workers & Pages tab (Underneath "Compute (Workers)" and click 'Start with Hello world'

Named the little guy "**supabase-tides-demo-1**.mason-c32.workers.dev"

Go back to the "Workers and pages" tab and selected **supabase-tides-demo-1**

Then i discoverexd that supabase no longer uses integrations with third parties. they have shofted integrations to **cloudflare wrangler**, which seems way more powerful for this use case in the long run (relevant wrangler and cloudflare documentation for you to read below)


## How to attack this problem using wranglers

take a look at this sample repo  from Cloudflare, woudl we be able tto set this up with supabase rather than OpenAuth? Can you use context7 mcp to pull context for anythign related to these services,swapping from openauth to supabase auth, switching from whatever interrface that is to react antive? Continuing connecting workers and a table, but leaving the auth table in supabase? https://context7.com/supabase/auth/llms.txt, https://context7.com/toolbeam/openauth/llms.txt, adn a dd1 database?

Again, I want a react antive application that connects to a remote cloudflare worker (details below) only when authenticated by the app and there is an active session - authentication by Supabase Auth. Database can be in CLoudflare D1

I think Supabase auth shoudl send some sort of API key to let the worker know they are an authorized user. I think Auth with headers (documetnaiton below) coudl be extremely helpful. Also check otu the supabase documentaton

## What we have so far:

#### Supabase project setup:

supabaseUrl = 'https://hcfxujzqlyaxvbetyano.supabase.co';
supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y';

I dont htink JWT tokens are totally necesary for this given how we wil be using headers (i beleive) so lets try to avoid them

supaabse email/password authentication is all setup

#### Worker envoronment

Not to sure if this is feasible but we have a working demo in `/supabase-tides-demo-1`



### Remote cloudflare worker details:

Domains & Routes
Define the domains, subdomains and routes where your Worker is accessible

Type
Value
workers.dev
supabase-tides-demo-1.mason-c32.workers.dev



### Cloudlfar wranglers docs (from website)

#### Connecting to severless database documentation:

---
title: Connect to databases · Cloudflare Workers docs
description: Learn about the different kinds of database integrations Cloudflare supports.
lastUpdated: 2025-07-02T16:48:57.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers/databases/connecting-to-databases/
  md: https://developers.cloudflare.com/workers/databases/connecting-to-databases/index.md
---

Cloudflare Workers can connect to and query your data in both SQL and NoSQL databases, including:

* Cloudflare's own [D1](https://developers.cloudflare.com/d1/), a serverless SQL-based database.
* Traditional hosted relational databases, including Postgres and MySQL, using [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) (recommended) to significantly speed up access.
* Serverless databases, including Supabase, MongoDB Atlas, PlanetScale, and Prisma.

### D1 SQL database

D1 is Cloudflare's own SQL-based, serverless database. It is optimized for global access from Workers, and can scale out with multiple, smaller (10GB) databases, such as per-user, per-tenant or per-entity databases. Similar to some serverless databases, D1 pricing is based on query and storage costs.

| Database | Library or Driver | Connection Method |
| - | - | - |
| [D1](https://developers.cloudflare.com/d1/) | [Workers binding](https://developers.cloudflare.com/d1/worker-api/), integrates with [Prisma](https://www.prisma.io/), [Drizzle](https://orm.drizzle.team/), and other ORMs | [Workers binding](https://developers.cloudflare.com/d1/worker-api/), [REST API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/) |

### Traditional SQL databases

Traditional databases use SQL drivers that use [TCP sockets](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/) to connect to the database. TCP is the de-facto standard protocol that many databases, such as PostgreSQL and MySQL, use for client connectivity. These drivers are also widely compatible with your preferred ORM libraries and query builders.

This also includes serverless databases that are PostgreSQL or MySQL-compatible like [Supabase](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/), [Neon](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/) or [PlanetScale](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-database-providers/planetscale/), which can be connected to using both native [TCP sockets and Hyperdrive](https://developers.cloudflare.com/hyperdrive/) or [serverless HTTP-based drivers](https://developers.cloudflare.com/workers/databases/connecting-to-databases/#serverless-databases) (detailed below).

| Database | Integration | Library or Driver | Connection Method |
| - | - | - | - |
| [Postgres](https://developers.cloudflare.com/workers/tutorials/postgres/) | Direct connection | [node-postgres](https://node-postgres.com/),[Postgres.js](https://github.com/porsager/postgres) | [TCP Socket](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/) via database driver, using [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) for optimal performance (optional, recommended) |
| [MySQL](https://developers.cloudflare.com/workers/tutorials/mysql/) | Direct connection | [mysql2](https://github.com/sidorares/node-mysql2), [mysql](https://github.com/mysqljs/mysql) | [TCP Socket](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/) via database driver, using [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) for optimal performance (optional, recommended) |

Speed up database connectivity with Hyperdrive

Connecting to SQL databases with TCP sockets requires multiple roundtrips to establish a secure connection before a query to the database is made. Since a connection must be re-established on every Worker invocation, this adds unnecessary latency.

[Hyperdrive](https://developers.cloudflare.com/hyperdrive/) solves this by pooling database connections globally to eliminate unnecessary roundtrips and speed up your database access. Learn more about [how Hyperdrive works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/).

### Serverless databases

Serverless databases may provide direct connection to the underlying database, or provide HTTP-based proxies and drivers (also known as serverless drivers).

For PostgreSQL and MySQL serverless databases, you can connect to the underlying database directly using the native database drivers and ORMs you are familiar with, using Hyperdrive (recommended) to speed up connectivity and pool database connections. When you use Hyperdrive, your connection pool is managed across all of Cloudflare regions and optimized for usage from Workers.

You can also use serverless driver libraries to connect to the HTTP-based proxies managed by the database provider. These may also provide connection pooling for traditional SQL databases and reduce the amount of roundtrips needed to establish a secure connection, similarly to Hyperdrive.

| Database | Library or Driver | Connection Method |
| - | - | - |
| [PlanetScale](https://planetscale.com/blog/introducing-the-planetscale-serverless-driver-for-javascript) | [Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-database-providers/planetscale), [@planetscale/database](https://github.com/planetscale/database-js) | [mysql2](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/mysql2/) or [mysql](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/mysql/), or API via client library |
| [Supabase](https://github.com/supabase/supabase/tree/master/examples/with-cloudflare-workers) | [Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/), [@supabase/supabase-js](https://github.com/supabase/supabase-js) | [node-postgres](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/),[Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/), or API via client library |
| [Prisma](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-cloudflare-workers) | [prisma](https://github.com/prisma/prisma) | API via client library |
| [Neon](https://blog.cloudflare.com/neon-postgres-database-from-workers/) | [Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/), [@neondatabase/serverless](https://neon.tech/blog/serverless-driver-for-postgres/) | [node-postgres](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/),[Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/), or API via client library |
| [Hasura](https://hasura.io/blog/building-applications-with-cloudflare-workers-and-hasura-graphql-engine/) | API | GraphQL API via fetch() |
| [Upstash Redis](https://blog.cloudflare.com/cloudflare-workers-database-integration-with-upstash/) | [@upstash/redis](https://github.com/upstash/upstash-redis) | API via client library |
| [TiDB Cloud](https://docs.pingcap.com/tidbcloud/integrate-tidbcloud-with-cloudflare) | [@tidbcloud/serverless](https://github.com/tidbcloud/serverless-js) | API via client library |

Once you have installed the necessary packages, use the APIs provided by these packages to connect to your database and perform operations on it. Refer to detailed links for service-specific instructions.

## Authentication

If your database requires authentication, use Wrangler secrets to securely store your credentials. To do this, create a secret in your Cloudflare Workers project using the following [`wrangler secret`](https://developers.cloudflare.com/workers/wrangler/commands/#secret) command:

```sh
wrangler secret put <SECRET_NAME>
```

Then, retrieve the secret value in your code using the following code snippet:

```js
const secretValue = env.<SECRET_NAME>;
```

Use the secret value to authenticate with the external service. For example, if the external service requires an API key or database username and password for authentication, include these in using the relevant service's library or API.

For services that require mTLS authentication, use [mTLS certificates](https://developers.cloudflare.com/workers/runtime-apis/bindings/mtls) to present a client certificate.

## Next steps

* Learn how to connect to [an existing PostgreSQL database](https://developers.cloudflare.com/hyperdrive/) with Hyperdrive.
* Discover [other storage options available](https://developers.cloudflare.com/workers/platform/storage-options/) for use with Workers.
* [Create your first database](https://developers.cloudflare.com/d1/get-started/) with Cloudflare D1.







### Auth with ehaders (from cloufdflare website):

---
title: Auth with headers · Cloudflare Workers docs
description: Allow or deny a request based on a known pre-shared key in a
  header. This is not meant to replace the WebCrypto API.
lastUpdated: 2025-04-16T21:02:18.000Z
chatbotDeprioritize: false
tags: Authentication,Web Crypto
source_url:
  html: https://developers.cloudflare.com/workers/examples/auth-with-headers/
  md: https://developers.cloudflare.com/workers/examples/auth-with-headers/index.md
---

Caution when using in production

The example code contains a generic header key and value of `X-Custom-PSK` and `mypresharedkey`. To best protect your resources, change the header key and value in the Workers editor before saving your code.

* JavaScript

  ```js
  export default {
    async fetch(request) {
      /**
       * @param {string} PRESHARED_AUTH_HEADER_KEY Custom header to check for key
       * @param {string} PRESHARED_AUTH_HEADER_VALUE Hard coded key value
       */
      const PRESHARED_AUTH_HEADER_KEY = "X-Custom-PSK";
      const PRESHARED_AUTH_HEADER_VALUE = "mypresharedkey";
      const psk = request.headers.get(PRESHARED_AUTH_HEADER_KEY);


      if (psk === PRESHARED_AUTH_HEADER_VALUE) {
        // Correct preshared header key supplied. Fetch request from origin.
        return fetch(request);
      }


      // Incorrect key supplied. Reject the request.
      return new Response("Sorry, you have supplied an invalid key.", {
        status: 403,
      });
    },
  };
  ```

* TypeScript

  ```ts
  export default {
    async fetch(request): Promise<Response> {
      /**
       * @param {string} PRESHARED_AUTH_HEADER_KEY Custom header to check for key
       * @param {string} PRESHARED_AUTH_HEADER_VALUE Hard coded key value
       */
      const PRESHARED_AUTH_HEADER_KEY = "X-Custom-PSK";
      const PRESHARED_AUTH_HEADER_VALUE = "mypresharedkey";
      const psk = request.headers.get(PRESHARED_AUTH_HEADER_KEY);


      if (psk === PRESHARED_AUTH_HEADER_VALUE) {
        // Correct preshared header key supplied. Fetch request from origin.
        return fetch(request);
      }


      // Incorrect key supplied. Reject the request.
      return new Response("Sorry, you have supplied an invalid key.", {
        status: 403,
      });
    },
  } satisfies ExportedHandler;
  ```

* Python

  ```py
  from workers import Response, fetch


  async def on_fetch(request):
      PRESHARED_AUTH_HEADER_KEY = "X-Custom-PSK"
      PRESHARED_AUTH_HEADER_VALUE = "mypresharedkey"


      psk = request.headers[PRESHARED_AUTH_HEADER_KEY]


      if psk == PRESHARED_AUTH_HEADER_VALUE:
        # Correct preshared header key supplied. Fetch request from origin.
        return fetch(request)


      # Incorrect key supplied. Reject the request.
      return Response("Sorry, you have supplied an invalid key.", status=403)
  ```

* Hono

  ```ts
  import { Hono } from 'hono';


  const app = new Hono();


  // Add authentication middleware
  app.use('*', async (c, next) => {
    /**
     * Define authentication constants
     */
    const PRESHARED_AUTH_HEADER_KEY = "X-Custom-PSK";
    const PRESHARED_AUTH_HEADER_VALUE = "mypresharedkey";


    // Get the pre-shared key from the request header
    const psk = c.req.header(PRESHARED_AUTH_HEADER_KEY);


    if (psk === PRESHARED_AUTH_HEADER_VALUE) {
      // Correct preshared header key supplied. Continue to the next handler.
      await next();
    } else {
      // Incorrect key supplied. Reject the request.
      return c.text("Sorry, you have supplied an invalid key.", 403);
    }
  });


  // Handle all authenticated requests by passing through to origin
  app.all('*', async (c) => {
    return fetch(c.req.raw);
  });


  export default app;
  ```



#### Integratiosn with Supabase


---
title: Supabase · Cloudflare Workers docs
description: Supabase is an open source Firebase alternative and a PostgreSQL
  database service that offers real-time functionality, database backups, and
  extensions. With Supabase, developers can quickly set up a PostgreSQL database
  and build applications.
lastUpdated: 2025-07-02T08:58:55.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/
  md: https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/index.md
---

[Supabase](https://supabase.com/) is an open source Firebase alternative and a PostgreSQL database service that offers real-time functionality, database backups, and extensions. With Supabase, developers can quickly set up a PostgreSQL database and build applications.

Note

The Supabase client (`@supabase/supabase-js`) provides access to Supabase's various features, including database access. If you need access to all of the Supabase client functionality, use the Supabase client.

If you want to connect directly to the Supabase Postgres database, connect using [Hyperdrive](https://developers.cloudflare.com/hyperdrive). Hyperdrive can provide lower latencies because it performs the database connection setup and connection pooling across Cloudflare's network. Hyperdrive supports native database drivers, libraries, and ORMs, and is included in all [Workers plans](https://developers.cloudflare.com/hyperdrive/platform/pricing/). Learn more about Hyperdrive in [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/).

* Supabase client

  ### Supabase client setup

  To set up an integration with Supabase:

  1. You need to have an existing Supabase database to connect to. [Create a Supabase database](https://supabase.com/docs/guides/database/tables#creating-tables) or [have an existing database to connect to Supabase and load data from](https://supabase.com/docs/guides/database/tables#loading-data).

  2. Create a `countries` table with the following query. You can create a table in your Supabase dashboard in two ways:

     * Use the table editor, which allows you to set up Postgres similar to a spreadsheet.
     * Alternatively, use the [SQL editor](https://supabase.com/docs/guides/database/overview#the-sql-editor):

     ```sql
     CREATE TABLE countries (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL
     );
     ```

  3. Insert some data in your newly created table. Run the following commands to add countries to your table:

     ```sql
     INSERT INTO countries (name) VALUES ('United States');
     INSERT INTO countries (name) VALUES ('Canada');
     INSERT INTO countries (name) VALUES ('The Netherlands');
     ```

  4. Configure the Supabase database credentials in your Worker:

     You need to add your Supabase URL and anon key as secrets to your Worker. Get these from your [Supabase Dashboard](https://supabase.com/dashboard) under **Settings** > **API**, then add them as secrets using Wrangler:

     ```sh
     # Add the Supabase URL as a secret
     npx wrangler secret put SUPABASE_URL
     # When prompted, paste your Supabase project URL


     # Add the Supabase anon key as a secret
     npx wrangler secret put SUPABASE_KEY
     # When prompted, paste your Supabase anon/public key
     ```

  5. In your Worker, install the `@supabase/supabase-js` driver to connect to your database and start manipulating data:

     * npm

       ```sh
       npm i @supabase/supabase-js
       ```

     * yarn

       ```sh
       yarn add @supabase/supabase-js
       ```

     * pnpm

       ```sh
       pnpm add @supabase/supabase-js
       ```

  6. The following example shows how to make a query to your Supabase database in a Worker. The credentials needed to connect to Supabase have been added as secrets to your Worker.

     ```js
     import { createClient } from "@supabase/supabase-js";


     export default {
       async fetch(request, env) {
         const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
         const { data, error } = await supabase.from("countries").select("*");
         if (error) throw error;
         return new Response(JSON.stringify(data), {
           headers: {
             "Content-Type": "application/json",
           },
         });
       },
     };
     ```

  To learn more about Supabase, refer to [Supabase's official documentation](https://supabase.com/docs).

* Hyperdrive

  When connecting to Supabase with Hyperdrive, you connect directly to the underlying Postgres database. This provides the lowest latency for databsae queries when accessed server-side from Workers. To connect to Supabase using [Hyperdrive](https://developers.cloudflare.com/hyperdrive), follow these steps:

  ## 1. Allow Hyperdrive access

  You can connect Hyperdrive to any existing Supabase database as the Postgres user which is set up during project creation. Alternatively, to create a new user for Hyperdrive, run these commands in the [SQL Editor](https://supabase.com/dashboard/project/_/sql/new).

  The database endpoint can be found in the [database settings page](https://supabase.com/dashboard/project/_/settings/database).

  With a database user, password, database endpoint (hostname and port) and database name (default: postgres), you can now set up Hyperdrive.

  ## 2. Create a database configuration

  To configure Hyperdrive, you will need:

  * The IP address (or hostname) and port of your database.
  * The database username (for example, `hyperdrive-demo`) you configured in a previous step.
  * The password associated with that username.
  * The name of the database you want Hyperdrive to connect to. For example, `postgres`.

  Hyperdrive accepts the combination of these parameters in the common connection string format used by database drivers:

  ```txt
  postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name
  ```

  Most database providers will provide a connection string you can directly copy-and-paste directly into Hyperdrive.

  To create a Hyperdrive configuration with the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/), open your terminal and run the following command. Replace \<NAME\_OF\_HYPERDRIVE\_CONFIG> with a name for your Hyperdrive configuration and paste the connection string provided from your database host, or replace `user`, `password`, `HOSTNAME_OR_IP_ADDRESS`, `port`, and `database_name` placeholders with those specific to your database:

  ```sh
  npx wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"
  ```

  Note

  Hyperdrive will attempt to connect to your database with the provided credentials to verify they are correct before creating a configuration. If you encounter an error when attempting to connect, refer to Hyperdrive's [troubleshooting documentation](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug possible causes.

  This command outputs a binding for the [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

  * wrangler.jsonc

    ```jsonc
    {
      "name": "hyperdrive-example",
      "main": "src/index.ts",
      "compatibility_date": "2024-08-21",
      "compatibility_flags": [
        "nodejs_compat"
      ],
      "hyperdrive": [
        {
          "binding": "HYPERDRIVE",
          "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"
        }
      ]
    }
    ```

  * wrangler.toml

    ```toml
    name = "hyperdrive-example"
    main = "src/index.ts"
    compatibility_date = "2024-08-21"
    compatibility_flags = ["nodejs_compat"]


    # Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.
    [[hyperdrive]]
    binding = "HYPERDRIVE"
    id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"
    ```

  ## 3. Use Hyperdrive from your Worker

  Install the `node-postgres` driver:

  * npm

    ```sh
    npm i pg@>8.16.3
    ```

  * yarn

    ```sh
    yarn add pg@>8.16.3
    ```

  * pnpm

    ```sh
    pnpm add pg@>8.16.3
    ```

  Note

  The minimum version of `node-postgres` required for Hyperdrive is `8.16.3`.

  If using TypeScript, install the types package:

  * npm

    ```sh
    npm i -D @types/pg
    ```

  * yarn

    ```sh
    yarn add -D @types/pg
    ```

  * pnpm

    ```sh
    pnpm add -D @types/pg
    ```

  Add the required Node.js compatibility flags and Hyperdrive binding to your `wrangler.jsonc` file:

  * wrangler.jsonc

    ```jsonc
    {
      "compatibility_flags": [
        "nodejs_compat"
      ],
      "compatibility_date": "2024-09-23",
      "hyperdrive": [
        {
          "binding": "HYPERDRIVE",
          "id": "<your-hyperdrive-id-here>"
        }
      ]
    }
    ```

  * wrangler.toml

    ```toml
    # required for database drivers to function
    compatibility_flags = ["nodejs_compat"]
    compatibility_date = "2024-09-23"


    [[hyperdrive]]
    binding = "HYPERDRIVE"
    id = "<your-hyperdrive-id-here>"
    ```

  Create a new `Client` instance and pass the Hyperdrive `connectionString`:

  ```ts
  // filepath: src/index.ts
  import { Client } from "pg";


  export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      // Create a new client instance for each request.
      const client = new Client({
        connectionString: env.HYPERDRIVE.connectionString,
      });


      try {
        // Connect to the database
        await client.connect();
        console.log("Connected to PostgreSQL database");


        // Perform a simple query
        const result = await client.query("SELECT * FROM pg_tables");


        // Clean up the client after the response is returned, before the Worker is killed
        ctx.waitUntil(client.end());


        return Response.json({
          success: true,
          result: result.rows,
        });
      } catch (error: any) {
        console.error("Database error:", error.message);


        new Response('Internal error occurred', { status: 500 });
      }
    },
  };
  ```

  Note

  If you expect to be making multiple parallel database queries within a single Worker invocation, consider using a [connection pool (`pg.Pool`)](https://node-postgres.com/apis/pool) to allow for parallel queries. If doing so, set the max connections of the connection pool to 5 connections. This ensures that the connection pool fits within [Workers' concurrent open connections limit of 6](https://developers.cloudflare.com/workers/platform/limits), which affect TCP connections that database drivers use.

  Note

  When connecting to a Supabase database with Hyperdrive, you should use a driver like [node-postgres (pg)](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) or [Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/) to connect directly to the underlying database instead of the [Supabase JavaScript client](https://github.com/supabase/supabase-js). Hyperdrive is optimized for database access for Workers and will perform global connection pooling and fast query routing by connecting directly to your database.

  ## Next steps

  * Learn more about [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/).
  * Refer to the [troubleshooting guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/) to debug common issues.
  * Understand more about other [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) available to Cloudflare Workers.

* npm

  ```sh
  npm i @supabase/supabase-js
  ```

* yarn

  ```sh
  yarn add @supabase/supabase-js
  ```

* pnpm

  ```sh
  pnpm add @supabase/supabase-js
  ```

* wrangler.jsonc

  ```jsonc
  {
    "name": "hyperdrive-example",
    "main": "src/index.ts",
    "compatibility_date": "2024-08-21",
    "compatibility_flags": [
      "nodejs_compat"
    ],
    "hyperdrive": [
      {
        "binding": "HYPERDRIVE",
        "id": "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  name = "hyperdrive-example"
  main = "src/index.ts"
  compatibility_date = "2024-08-21"
  compatibility_flags = ["nodejs_compat"]


  # Pasted from the output of `wrangler hyperdrive create <NAME_OF_HYPERDRIVE_CONFIG> --connection-string=[...]` above.
  [[hyperdrive]]
  binding = "HYPERDRIVE"
  id = "<ID OF THE CREATED HYPERDRIVE CONFIGURATION>"
  ```

* npm

  ```sh
  npm i pg@>8.16.3
  ```

* yarn

  ```sh
  yarn add pg@>8.16.3
  ```

* pnpm

  ```sh
  pnpm add pg@>8.16.3
  ```

* npm

  ```sh
  npm i -D @types/pg
  ```

* yarn

  ```sh
  yarn add -D @types/pg
  ```

* pnpm

  ```sh
  pnpm add -D @types/pg
  ```

* wrangler.jsonc

  ```jsonc
  {
    "compatibility_flags": [
      "nodejs_compat"
    ],
    "compatibility_date": "2024-09-23",
    "hyperdrive": [
      {
        "binding": "HYPERDRIVE",
        "id": "<your-hyperdrive-id-here>"
      }
    ]
  }
  ```

* wrangler.toml

  ```toml
  # required for database drivers to function
  compatibility_flags = ["nodejs_compat"]
  compatibility_date = "2024-09-23"


  [[hyperdrive]]
  binding = "HYPERDRIVE"
  id = "<your-hyperdrive-id-here>"
  ```
