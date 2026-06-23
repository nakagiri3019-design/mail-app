# 住信デモ accounts.json 一元化 実装計画

## 目標

`mail-app/sbi-app/accounts.json` を唯一の正（single source of truth）として、
住信本体（sbi-app/index.html）とランチャー（nakagiri3019-design.github.io/index.html）の
両方がそこから会社データを読む構成にする。

**完成後のワークフロー：** accounts.json に会社を1ブロック追加して push するだけで、
1. 住信デモで `?user=新ID` が開き、明細・口座情報が表示される
2. ランチャーの住信カードにその会社へのリンクが自動出現する

---

## 1. accounts.json の置き場所と到達性

**ファイルパス：** `mail-app/sbi-app/accounts.json`

**公開URL：** `https://nakagiri3019-design.github.io/mail-app/sbi-app/accounts.json`

| アクセス元 | fetch URL | CORS |
|---|---|---|
| `sbi-app/index.html` | `./accounts.json`（相対パス） | 同一オリジン・問題なし |
| `nakagiri3019-design.github.io/index.html` | `https://nakagiri3019-design.github.io/mail-app/sbi-app/accounts.json` | 同一ドメイン（.github.io）・問題なし |

---

## 2. accounts.json フィールド定義

### 設計方針

- 5月以前の月次データ（`_MONTHS_BASE`）は全社共通 → sbi-app/index.html に残す
- 6月データのみ会社ごとに異なる → accounts.json に持つ
- 新会社追加 = **accounts.json に1ブロック追加するだけ**

### スキーマ

```json
[
  {
    "id": "nakagiri",
    "displayName": "中桐由美子（株式会社アークラボ）",
    "info": {
      "name": "株式会社アークラボ",
      "kana": "カ）ア-クラボ",
      "branch": "第一ビジネス営業部（301）1000711",
      "accountNo": "301-1000711"
    },
    "jun": {
      "label": "2026年6月",
      "in": "1,101,058",
      "out": "817,541",
      "data": [
        {"t":"day","v":"30日"},
        {"t":"tx","name":"振込手数料","amt":"-145","pos":false,"bal":"..."},
        ...
      ]
    }
  }
]
```

### フィールド説明

| フィールド | 型 | 用途 |
|---|---|---|
| `id` | string | ?user= の値・ランチャーリンクのパラメータ |
| `displayName` | string | ランチャーのリンクテキストに使用 |
| `info.name` | string | 口座名義（会社名） |
| `info.kana` | string | カナ表記 |
| `info.branch` | string | 支店名・番号 |
| `info.accountNo` | string | 口座番号 |
| `jun.label` | string | 月次タブのラベル（例: "2026年6月"） |
| `jun.in` | string | 6月入金合計（カンマ区切り文字列） |
| `jun.out` | string | 6月出金合計（カンマ区切り文字列） |
| `jun.data` | array | 明細行配列（既存の DATA_JUN 等と同形式） |

### 明細行（data配列）の要素形式

```json
{"t":"day","v":"19日"}
{"t":"tx","name":"振込手数料","amt":"-145","pos":false,"bal":"401,131"}
{"t":"fee"}
```

---

## 3. 住信本体（sbi-app/index.html）の改修方法

### 現状

```javascript
var _INFO_ARKLABO = { branch:'...', accountNo:'...', name:'...', kana:'...' };
var DATA_JUN_AVANTIA = [...];
var DATA_JUN_EFSTYLE = [...];
var ACCOUNTS = {
  nakagiri: { info: _INFO_ARKLABO, months: Object.assign({ jun: { data:DATA_JUN, ... } }, _MONTHS_BASE) },
  avantia:  { info: _INFO_ARKLABO, months: Object.assign({ jun: { data:DATA_JUN_AVANTIA, ... } }, _MONTHS_BASE) },
  ...
};
// → 即時 ?user= ルーティング・口座情報・残高表示
```

### 変更後の流れ

```
ページ読み込み
  ↓
fetch('./accounts.json')
  ↓ 成功
accounts配列をループして ACCOUNTS オブジェクトを構築
  ACCOUNTS[a.id] = {
    info: a.info,
    months: Object.assign({ jun: a.jun }, MONTHS_BASE)  ← 既存の共通月次データを合成
  }
  ↓
initPage() を呼ぶ（?user= ルーティング・残高表示・口座情報書き換え）

  ↓ 失敗（fallback）
ACCOUNTS = { nakagiri: { ハードコードのデフォルト値 } } にして initPage() を呼ぶ
```

### 削除する変数

- `var _INFO_ARKLABO` → accounts.json の各社 `info` に移行
- `var DATA_JUN` → accounts.json の nakagiri `jun.data` に移行
- `var DATA_JUN_AVANTIA` → accounts.json の avantia `jun.data` に移行
- `var DATA_JUN_EFSTYLE` → accounts.json の efstyle `jun.data` に移行
- `var ACCOUNTS = { ... }` → 削除（fetch後に動的構築）

### 残す変数

- `_MONTHS_BASE`（may〜jan の共通月次データ）→ **そのまま残す**
- `DATA_MAY`, `DATA_APR`, `DATA_MAR`, `DATA_FEB`, `DATA_JAN` → **そのまま残す**

### 追加するコード（概略）

```javascript
var ACCOUNTS = {};

fetch('./accounts.json')
  .then(function(r){ return r.json(); })
  .then(function(list){
    list.forEach(function(a){
      ACCOUNTS[a.id] = {
        info: a.info,
        months: Object.assign({ jun: a.jun }, _MONTHS_BASE)
      };
    });
    initPage();
  })
  .catch(function(){
    // fallback: nakagiri ハードコード
    ACCOUNTS = { nakagiri: { info: _FALLBACK_INFO, months: Object.assign({ jun: _FALLBACK_JUN }, _MONTHS_BASE) } };
    initPage();
  });

function initPage() {
  // 既存の ?user= ルーティング・残高・口座情報書き換えコードをここに移動
}
```

---

## 4. ランチャー（nakagiri3019-design.github.io/index.html）の改修方法

### 現状

住信SBIカードに手書きリンク3件あり（sbi-app へのリンクは未掲載）。

### 変更内容

住信カードの `<div class="entries">` 内に挿入先を追加：

```html
<div id="sbi-accounts-list"></div>
```

ページ末尾の `<script>` に fetch コードを追加：

```javascript
(function(){
  var BASE = 'https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=';
  fetch('https://nakagiri3019-design.github.io/mail-app/sbi-app/accounts.json')
    .then(function(r){ return r.json(); })
    .then(function(list){
      var el = document.getElementById('sbi-accounts-list');
      if (!el) return;
      el.innerHTML = list.map(function(a){
        return '<a class="entry" href="' + BASE + a.id + '" target="_blank">'
          + a.displayName
          + ' <span class="who">?user=' + a.id + '</span></a>';
      }).join('');
    })
    .catch(function(){ /* fallback: 既存の手書きリンクが残る */ });
})();
```

### 既存の手書きリンクは削除しない

fetch 失敗時でも `/mail-app/sbi/` 等の既存リンクは表示される。
自動生成リンクは既存エントリの後に追加する。

---

## 5. fetch 失敗時の fallback

| 場面 | 対応 |
|---|---|
| **sbi-app** | `_FALLBACK_INFO`（アークラボ）と `_FALLBACK_JUN`（nakagiri 6月データ）をインラインで保持し、nakagiri のみで動作する |
| **ランチャー** | `#sbi-accounts-list` を空のまま（既存の手書きリンク3件が残る） |

---

## 6. 作業順序

```
Step 1: accounts.json を作成（既存5社のデータ移行）
  → ブラウザで直接 accounts.json の URL を開いて JSON valid か確認
  → 5社分のフィールドが揃っているか目視確認

Step 2: sbi-app/index.html を fetch 方式に改修
  → node --check index.html は非対応のため、ブラウザのコンソールでエラーなし確認
  → ?user=nakagiri / avantia / efstyle / mentor / levanta の全5社動作確認
  → 残高・明細・口座情報が各社正しく表示されるか確認

Step 3: mail-app リポジトリに commit & push
  → 本番URL（/mail-app/sbi-app/?user=nakagiri 等）で全5社を確認
  → https://...mail-app/sbi-app/accounts.json がブラウザで JSON として返るか確認

Step 4: ランチャー（nakagiri3019-design.github.io）を改修
  → Step 3 後に本番 accounts.json が取得できる状態で改修
  → ブラウザ開発者ツールの Network タブで fetch 成功を確認

Step 5: ランチャーリポジトリに commit & push
  → 本番ランチャーで住信カードにリンクが出るか確認（5社分）
```

---

## 7. 既存5社のデータ移行手順

### 現在のデータ所在

| データ | 現在の変数 | 移行先 |
|---|---|---|
| 口座情報（全社共通） | `_INFO_ARKLABO` | accounts.json 各社の `info` |
| 6月明細（nakagiri/mentor/levanta） | `DATA_JUN` | nakagiri / mentor / levanta の `jun.data` |
| 6月明細（avantia） | `DATA_JUN_AVANTIA` | avantia の `jun.data` |
| 6月明細（efstyle） | `DATA_JUN_EFSTYLE` | efstyle の `jun.data` |
| 5月以前の月次 | `_MONTHS_BASE` + `DATA_MAY` 等 | **そのまま index.html に残す** |

### 変換作業

JS オブジェクトリテラル → JSON への変換：

```
{t:'day', v:'19日'}     →  {"t":"day","v":"19日"}
{t:'tx', name:'振込...', amt:'-145', pos:false, bal:'...'} → {"t":"tx","name":"振込...","amt":"-145","pos":false,"bal":"..."}
```

PowerShell でキーへのクォート追加・シングルクォートをダブルクォートに変換して生成。

### 各社の displayName 設定

| id | displayName |
|---|---|
| nakagiri | 中桐由美子（株式会社アークラボ） |
| avantia | アバンティア |
| efstyle | イーエフスタイル |
| mentor | メンター（仮） |
| levanta | レバンタ（仮） |

---

## 8. 完成後のワークフロー例（新会社1ブロック追加）

`sbi-app/accounts.json` に以下を追加して push するだけ：

```json
{
  "id": "newcorp",
  "displayName": "株式会社ニュー商事",
  "info": {
    "name": "株式会社ニュー商事",
    "kana": "カ）ニユーシヨウジ",
    "branch": "第一ビジネス営業部（301）1000711",
    "accountNo": "301-XXXXXXX"
  },
  "jun": {
    "label": "2026年6月",
    "in": "800,000",
    "out": "650,000",
    "data": [
      {"t":"day","v":"20日"},
      {"t":"tx","name":"振込＊カ）ニユーシヨウジ","amt":"+800,000","pos":true,"bal":"800,000"},
      {"t":"day","v":"15日"},
      {"t":"tx","name":"振込手数料","amt":"-145","pos":false,"bal":"0"},
      {"t":"tx","name":"支払","amt":"-649,855","pos":false,"bal":"145"}
    ]
  }
}
```

これだけで：
- `?user=newcorp` で住信デモが開き、明細・口座情報が表示される
- ランチャーに「株式会社ニュー商事 `?user=newcorp`」リンクが自動出現

---

## 実装方針

**1段階ずつ、各段階でブラウザ確認をしてから次に進む。**

次の段階に進む前に必ず：
- ブラウザのコンソールでエラーなしを確認
- 動作確認項目をすべてパスしたことを確認
- commit してから次の Step へ
