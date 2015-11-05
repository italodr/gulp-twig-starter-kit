There are many commands available to help you build and test sites. Here are a few highlights to get started with.

## Watch For Changes & Automatically Refresh Across Devices

```sh
$ gulp watch
```

This outputs an IP address you can use to locally test and another that can be used on devices
connected to your network.

## Build & Optimize

```sh
$ gulp
```

Build and optimize the current project, ready for deployment.
This includes linting as well as twig compiling, image, script, stylesheet and HTML optimization
and minification. It is made to create landing pages so it compiles Twig into HTML.

## Performance Insights

```sh
$ gulp pagespeed
```

Runs the deployed (public) version of your site against the [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) API to help you stay on top of where you can improve.
