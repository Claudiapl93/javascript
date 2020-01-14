import { LeafNode } from "../../structure/tree";
import Research from "./Research";

import { flatten } from "lodash-es";
import urlMethods from "url";

/**
 * Calculates link statistics.
 * E.g. which links a node or its children contains, and whether these links are:
 *  * internal (points to a page in the same domain), external (a page in another domain) or other.
 *  * marked as follow (search engines are allowed to follow this link) or no-follow (search engines are not allowed to follow the link).
 *
 *  @memberOf module:parsedPaper/research
 */
class LinkStatistics extends Research {
	/**
	 * Checks whether the given link is marked for search engines to not follow.
	 *
	 * @param {module:parsedPaper/structure.FormattingElement} linkElement The link to check.
	 *
	 * @returns {boolean} `true` if the link is marked as 'no-follow'.
	 *
	 * @private
	 */
	_isNoFollow( linkElement ) {
		/**
		 * Rel attribute.
		 * @var {string}
		 */
		const rel = linkElement.attributes ? linkElement.attributes.rel : false;

		if ( ! rel ) {
			return false;
		}

		return rel.split( /\s/ ).includes( "nofollow" );
	}

	_isHttp( protocol ) {
		if ( ! protocol ) {
			return false;
		}

		return ( protocol === "http:" || protocol === "https:" );
	}

	/**
	 * Checks whether the given link is:
	 *  * internal: points to a web page in the same domain as the current site.
	 *  * external: points to a web page in another domain as the current site.
	 *  * other: e.g. uses another protocol like `ftp`.
	 *
	 * @param {module:parsedPaper/structure.FormattingElement} linkElement The link to check.
	 * @param {string}                                         domain The domain to check against.
	 *
	 * @returns {"external"|"internal"|"other"} Whether the link points to an external, internal or other web page.
	 *
	 * @private
	 */
	_whichTarget( linkElement, domain ) {
		const link = linkElement.attributes ? linkElement.attributes.href : false;

		if ( ! link ) {
			return "other";
		}

		const url = urlMethods.parse( link );

		if ( ! this._isHttp( url.protocol ) || url.hash ) {
			return "other";
		}

		if ( url.hostname === domain ) {
			return "internal";
		}

		return "external";
	}

	/**
	 * Calculates link statistics for the given node.
	 *
	 * @param {module:parsedPaper/structure.LeafNode} node The node to calculate the research for.
	 *
	 * @returns {Promise<Object[]>} The research results.
	 */
	calculateFor( node ) {
		// Collect link elements.
		const links = node.textContainer.formatting.filter( element => element.type === "a" );

		// Collect statistics about the links.
		const results = links.map( link => {
			const noFollow = this._isNoFollow( link );
			const target = this._whichTarget( link, "yoast.com" );

			return { link, noFollow, target };
		} );

		return Promise.resolve( results );
	}

	/**
	 * Merges the given research results.
	 *
	 * @param {Object[]} results The results to merge
	 *
	 * @returns {Object[]} The merged results.
	 */
	mergeChildrenResults( results ) {
		return flatten( results );
	}
}

export default LinkStatistics;
