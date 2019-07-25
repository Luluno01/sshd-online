# SSHD-ONLINE

SSHD-Online.

## Usage

Clone this repository.

```Bash
git clone https://github.com/Luluno01/sshd-online.git
```

Install dependencies.

```Bash
npm install
```

Build.

```Bash
npm run build
```

Create initial user.

```Bash
npm run createUser -- <username> <password>
```

Set environment variable `DB_URL` (for database) and run server.

Note: SSHD-Online uses `sqlite3` by default. If you want to use other sequelize dialect, you will need to install the desired dialect manually (e.g. `npm install mysql2`).

For Linux users:

```Bash
DB_URL=sqlite:users.db && npm run serve
```

For Windows users:

```Batch
set DB_URL=sqlite:users.db&& npm run serve
```
