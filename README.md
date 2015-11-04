# EROSKI Landings

## Gulp, Twig & Grid Template

## Requirements

  * [Node.js](http://nodejs.org)
  * [Gulp](http://gulpjs.com/)
  * [Grunt](http://gruntjs.com/) for grunticon
  * [Google spreadsheet to json] (https://www.npmjs.com/package/google-spreadsheet-to-json)

## Quickstart

  * Run `npm install` to install Gulp dependencies
  * Run `npm install -g google-spreadsheet-to-json` to install globally
    Google spreadsheet to json

Then when you're working on your project, just run the following command:

```bash
gulp
```

To update the database for development:

```bash
gulp database
```

To upload automatically your project to runroomclients, run:
_(This updates automatically the database)_

```bash
gulp publish
```

If you want to release your project, run:
_(This updates automatically the database)_

```bash
gulp release
```
A zip file will be saved in release folder and will be send to the mail address
set in data file

## Conventions

Module names will use prefixes, as follow, to prevent any conflict with namings.

* fr_ (for landing Frescos/Fresh)
* ce_ (for landing Bodega/Cellar)
* gi_ (for landing Regalos/Gifts)
* re_ (for landing Recomendados/Recommended)

## Git Branches

We will have 2 main branches **master** and **development**
Each new branch will be created from development as follow:

* feature/frescos
* feature/bodega
* feature/regalos
* feature/recomendados

## Grid

We use the same structure as Foundation, with a little difference.
We use "g-" as prefix for all classes, "g-column" instead of "columns" and don't use "end".

```
<div class="g-row">
  <div class="g-small-12 g-medium-6 g-large-4 g-column">
  </div>
</div>
<div class="g-row g-large-collapse">
  <div class="g-medium-6 g-column">
  </div>
  <div class="g-medium-6 g-column">
  </div>
</div>
<div class="g-row g-collapse">
  <div class="g-small-12 g-column g-large-centered">
    <div class="g-row g-collapse">
      <div class="g-large-10 g-column">
      </div>
    </div>
  </div>
</div>
```

For more information use the [Foundation Grid docs](http://foundation.zurb.com/docs/components/grid.html)

## Tracking

### UTMs

UTMs requires 2 data attributes:

- data-utmproduct ***(slug of product name. ie: my-new-product)***
- data-utmterm ***(must always have the default value {{ page.utm.campaign }})***
- no-utm ***(if you don't want to track this link)***

Sample:
```
<a href="my-sample-url.com" data-utmproduct="my-new-awesome-product" data-utmterm="{{ page.utm.campaign }}">My new awesome product</a>
```

### Track Events

Track events need some custom classes to be add in the trigger element, and one of them needs a data attribute:

- CTA Tracking events: ***js-track-cta***
  requires:
  - data-track-action attribute with its value in spanish
  - url
- Super Online Tracking events: ***js-track-superonline***
  requires:
  - url
- Eroski Club Tracking events: ***js-track-club***
  requires:
  - url
- Footer menu Tracking events: ***js-track-footer***
  requires:
  - data-track-action attribute with its value in spanish

Sample:
```
<a class="js-track-footer js-track-superonline" href="my-sample-url.com" data-utmproduct="my-new-awesome-product" data-utmterm="{{ page.utm.campaign }}" data-track-action="Mi increíble nuevo producto">My new awesome product</a>
```
