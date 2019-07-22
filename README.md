# Koa Starter

Koa application starter.

## Usage

Clone this repository.

```Bash
git clone https://github.com/Luluno01/koa-starter.git
```

Copy `package.example.json` and rename the copied file to `package.json`.

```Bash
cp package.example.json package.json
```

Modify the package name, description, etc..

```Bash
vim package.json
```

Install dependencies.

```Bash
npm install
```

If you want to use `Redis` store (for caching), please do remember to install `redis`.

```Bash
npm install redis --save && npm install @types/redis --save-dev
```

If you are not using `Redis`, you need to manually delete the related code.
