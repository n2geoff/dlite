import Component from "./component.js";
import { getAttrs } from "./utils.js";

/**
 * Fetches the url passed to it and returns the response based on content type.
 *
 * Raises an error for >=400 status codes.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetcher(url) {
  return await fetch(url)
    .then((res) => {
      if (res.status >= 400) {
        throw new Error(`${res.url} (${res.status})`);
      }

      return res;
    })
    .then((res) => {
      if ((res.headers.get("content-type") || "").includes("json")) {
        return res.json();
      }

      return res.text();
    });
}

/**
 * dlite default function initializer
 * @param {object} options The configuration
 * @returns {HTMLElement} The custom element
 */
function Dlite(options) {
  const configuration = {
    /**
     * el
     * @type {HTMLElement | string}
     * Element or query selector where the in-place element will be rendered.
     * If $template is `null`, it will use the el#innerHTML as template.
     */
    el: null,

    /**
     * template
     * @type {string}
     * Template string used to create the component.
     * If it is set with `el`, `el` will be the target, but `template` will override its `innerHTML`.
     */
    template: null,

    /**
     * tagName
     * @type {string}
     * The tag name for the custom element. Not needed for in-place element.
     */
    tagName: null,

    /**
     * shadowDOM
     * @type {boolean}
     * Attach the `Custom Element` to a `Shadow DOM`. Defaults to `true`.
     */
    shadowDOM: true,

    /**
     * debug
     * @type {boolean}
     * Whether in debug mode or not.
     */
    debug: false,

    ...options,
  };

  const shouldCreateTag = !configuration.tagName;
  configuration.tagName =
    configuration.tagName ||
    `dlite-${Math.random().toString(36).substring(2, 9).toLowerCase()}`;

  if (configuration.el) {
    if (typeof configuration.el === "string") {
      const el = document.querySelector(configuration.el);

      if (!el) {
        throw new Error(`'${configuration.el}' could not be found.`);
      }

      configuration.el = el;
    }

    if (!configuration.template) {
      configuration.template = configuration.el.innerHTML;
    }

    // Clear out the innerHTML of the element
    configuration.el.innerHTML = "";

    if (shouldCreateTag) {
      const createdEl = document.createElement(configuration.tagName);

      // Set attributes from the original element on the new element
      // Useful so that `id`, `style`, `class` gets set on new `Custom Element`
      for (const [attrName, attrValue] of Object.entries(
        getAttrs(configuration.el)
      )) {
        createdEl.setAttribute(attrName, attrValue);
      }

      configuration.el.parentNode.replaceChild(createdEl, configuration.el);
    }
  } else if (!configuration.el && shouldCreateTag) {
    throw new Error(`Missing either 'el' or 'tagName' setting.`);
  }

  if (!configuration.template) {
    throw new Error(`Missing 'template' setting.`);
  }

  return Component(configuration);
}

/**
 *
 * @param {object|array} configuration `dlite` configuration or array of configurations
 * @param {object} sharedConfiguration shared global configurations fo reach component; only used with array of configurations
 * @returns {HTMLElement|Array<HTMLElement>} The custom element or array of custom elements for the configured components
 */
export default (configuration, sharedConfiguration = {}) => {
  if (Array.isArray(configuration)) {
    return configuration.map((config, index) => {
      try {
        return Dlite({ ...sharedConfiguration, ...config });
      } catch (e) {
        if (sharedConfiguration.debug || config.debug) {
          // Add error message to page
          const errorDiv = document.createElement("div");
          errorDiv.style.cssText =
            "background-color: red; color: white; padding: 10px;";
          errorDiv.innerHTML = `<h1 style="margin: 0;">Component ${
            index + 1
          }</h1>${e}<details><summary>Stacktrace</summary>${e.stack.replaceAll(
            "\n",
            "<br />"
          )}</details>`;
          document.body.prepend(errorDiv);

          console.error(e);
        } else {
          throw e;
        }
      }
    });
  } else {
    return Dlite(configuration);
  }
};
