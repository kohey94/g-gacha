# Repository Guidelines

## Project Structure & Module Organization

Next.jsのアプリケーションコードは `src/`、テストは `tests/`、要件などの文書は `docs/` にまとめます。`src/app/` に画面とRoute Handler、`src/components/` にUI部品、`src/data/` にデモ用固定データ、`src/lib/` に抽選や正規化などのロジックを配置します。テストの階層は対応する実装の階層に合わせます。新しいトップレベルディレクトリを追加したら、この文書または `README.md` に目的を記載してください。

## Build, Test, and Development Commands

`npm run dev` で開発サーバー、`npm run lint` でESLint、`npm test` で単体テスト、`npm run build` で本番ビルドを実行します。`npm run check` はlint、test、buildを順に実行する日常的な確認入口です。コマンドを変更した場合は `README.md` と本節を同時に更新してください。依存パッケージを追加する前に、必要な理由と標準機能などの代替案を説明します。

## Coding Style & Naming Conventions

文字コードは UTF-8、改行は LF を使用します。インデントや引用符は、導入したフォーマッター／リンターの設定を正とし、既存ファイルの形式に合わせてください。ファイル名は小文字を基本とし、複数語には `kebab-case`、型やクラスには `PascalCase`、変数や関数には各言語で一般的な規則を使います。コメントは意図がコードから読み取れない箇所に限り、簡潔な日本語で記述します。

## Testing Guidelines

機能追加や不具合修正には、正常系と主要な境界条件を確認するテストを添えてください。テスト名は対象と期待動作が分かる形にし、例として `tests/<module>.test.*` を使用します。テスト基盤を導入したら、全テストと単一テストの実行方法、必要なカバレッジ基準を明記してください。

## Commit & Pull Request Guidelines

参照可能な Git 履歴がないため、当面は `feat: add draw flow`、`fix: handle empty pool` のように、種別と要約を一行で記述します。コミットは一つの論理変更に絞ってください。プルリクエストには目的、変更内容、確認手順、関連 Issue を記載し、UI 変更にはスクリーンショットを添付します。

## Workflow, Security & Configuration

実装前に既存構成を確認し、複雑な変更は計画を共有して小さな単位で進めます。既存の仕様、UI、命名を尊重し、無関係な改修を混ぜないでください。秘密情報、API キー、端末固有設定はコミットせず、必要な環境変数は `.env.example` にダミー値で文書化し、実値を含む `.env` は無視対象にします。作業報告や設計メモは日本語で記述してください。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
