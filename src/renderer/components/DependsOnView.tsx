/**
 * ************************************
 *
 * @module  DependsOnView.tsx
 * @author
 * @date 3/11/20
 * @description Display area for services containers in Depends_On view : force-graph
 *
 * ************************************
 */
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { colorSchemeHash } from '../helpers/colorSchemeHash';
import {
  getHorizontalPosition,
  getVerticalPosition,
} from '../helpers/getSimulationDimensions';
import { getStatic } from '../scripts/static';
import {
  Services,
  Link,
  SGraph,
  SNode,
  SetSelectedContainer,
  Options,
  NodesObject,
  TreeMap,
  NodeChild,
} from '../App.d';

type Props = {
  services: Services;
  setSelectedContainer: SetSelectedContainer;
  options: Options;
  view: string;
};

const DependsOnView: React.FC<Props> = ({
  services,
  setSelectedContainer,
  options,
  view,
}) => {
  let links: Link[] = [];
  const nodesObject: NodesObject = Object.keys(services).reduce(
    (acc: NodesObject, sName: string, i) => {
      const ports: string[] = [];
      const volumes: string[] = [];
      if (services[sName].hasOwnProperty('ports')) {
        services[sName].ports.forEach(port => {
          ports.push(port);
        });
      }
      if (services[sName].hasOwnProperty('volumes')) {
        services[sName].volumes.forEach(vol => {
          volumes.push(vol);
        });
      }
      if (services[sName].hasOwnProperty('depends_on')) {
        services[sName].depends_on.forEach(el => {
          links.push({ source: el, target: sName });
        });
      }
      const node = {
        id: i,
        name: sName,
        ports,
        volumes,
        children: {},
        row: 0,
        rowLength: 0,
        column: 0,
      };
      acc[sName] = node;
      return acc;
    },
    {},
  );

  //roots object creation, needs to be a deep copy or else deletion of non-roots will remove from nodesObject
  const roots = JSON.parse(JSON.stringify(nodesObject));
  //iterate through links and find if the roots object contains any of the link targets
  links.forEach((link: Link) => {
    if (roots[link.target]) {
      //filter the roots
      delete roots[link.target];
    }
  });

  //create Tree
  const createTree = (node: NodeChild) => {
    Object.keys(node).forEach((root: string) => {
      links.forEach((link: Link) => {
        if (link.source === root) {
          node[root].children[link.target] = nodesObject[link.target];
        }
      });
      createTree(node[root].children);
    });
  };
  createTree(roots);

  //traverse tree and create object outlining the rows/columns in each tree
  const treeMap: TreeMap = {};
  const createTreeMap = (node: NodeChild, height: number = 0) => {
    if (!treeMap[height] && Object.keys(node).length > 0) treeMap[height] = [];
    Object.keys(node).forEach((sName: string) => {
      treeMap[height].push(sName);
      createTreeMap(node[sName].children, height + 1);
    });
  };
  createTreeMap(roots);

  // populate nodesObject with column, row, and rowLength
  const storePositionLocation = (treeHierarchy: TreeMap) => {
    Object.keys(treeHierarchy).forEach((row: string) => {
      treeHierarchy[row].forEach((sName: string, column: number) => {
        nodesObject[sName].row = Number(row);
        if (!nodesObject[sName].column) nodesObject[sName].column = column + 1;
        nodesObject[sName].rowLength = treeHierarchy[row].length;
      });
    });
  };
  storePositionLocation(treeMap);
  const treeDepth = Object.keys(treeMap).length;

  const nodes = Object.values(nodesObject);
  const serviceGraph: SGraph = {
    nodes,
    links,
  };

  /**
   *********************
   * Depends On View
   *********************
   */
  let container: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
  let forceGraph: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  let textsAndNodes: d3.Selection<SVGGElement, SNode, SVGGElement, unknown>;
  let width: number;
  let height: number;
  const topMargin = 20;
  const sideMargin = 20;
  const radius = 60; // Used to determine the size of each container for border enforcement
  const simulation = d3.forceSimulation<SNode>(serviceGraph.nodes);
  let linkLines: d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;
  // .force('center', d3.forceCenter<SNode>(width / 2, height / 2))
  useEffect(() => {
    container = d3.select('.depends-wrapper');
    width = parseInt(container.style('width'), 10);
    height = parseInt(container.style('height'), 10);

    //set location when ticked
    function ticked() {
      width = parseInt(container.style('width'), 10);
      height = parseInt(container.style('height'), 10);
      // Enforces borders
      textsAndNodes
        .attr('cx', (d: SNode) => {
          return (d.x = Math.max(
            sideMargin,
            Math.min(width - sideMargin - radius, d.x as number),
          ));
        })
        .attr('cy', (d: SNode) => {
          return (d.y = Math.max(
            15 + topMargin,
            Math.min(height - topMargin - radius, d.y as number),
          ));
        })
        .attr('transform', (d: SNode) => {
          return 'translate(' + d.x + ',' + d.y + ')';
        });
      if (view === 'depends_on') {
        linkLines
          .attr('x1', (d: any) => d.source.x + 30)
          .attr('y1', (d: any) => d.source.y + 30)
          .attr('x2', (d: any) => d.target.x + 30)
          .attr('y2', (d: any) => d.target.y + 30);
      }
      // simulation.force('center', d3.forceCenter<SNode>(w / 2, h / 2));
    }

    // move force graph with resizing window
    window.addEventListener('resize', ticked);

    //create force simulation
    if (view === 'depends_on') {
      simulation
        .force(
          'link',
          d3
            .forceLink<SNode, Link>(serviceGraph.links)
            .distance(130)
            .id((node: SNode) => node.name),
        )
        .force('charge', d3.forceManyBody<SNode>().strength(-radius * 3))
        .force('collide', d3.forceCollide(radius / 2))
        // .force('center', d3.forceCenter<SNode>(width / 2, height / 2))
        .on('tick', ticked);
    } else {
      const networkHolder: { [networkString: string]: boolean } = {};
      const getSpacing = (): number => {
        console.log('-->');
        nodes.forEach((d: SNode): void => {
          console.log('<--');
          console.log(d);
          if (d.networks) {
            console.log('--*');
            let networkString = '';
            d.networks.sort();
            d.networks.forEach(network => {
              console.log('*--');
              networkString += network;
            });
            networkHolder[networkString] = true;
          }
        });
        return width / (Object.keys(networkHolder).length + 1);
      };
      const spacing = getSpacing();
      console.log(networkHolder);
      const forceX = d3
        .forceX((d: SNode): any => {
          if (d.networks) {
            if (d.networks.length === 0) return width / 2;
            let networkString = '';
            d.networks.sort();
            d.networks.forEach(network => {
              networkString += network;
            });
            const place = Object.keys(networkHolder).indexOf(networkString);
            networkString = '';
            return (place + 1) * spacing;
          }
          return width / 2;
        })
        .strength(0.5);

      const forceY = d3.forceY(height / 2).strength(0.5);
      //create force simulation
      simulation
        .force('x', forceX)
        .force('y', forceY)
        .force('charge', d3.forceManyBody<SNode>().strength(-radius * 3))
        .force('collide', d3.forceCollide(radius / 2))
        // .force('center', d3.forceCenter<SNode>(width / 2, height / 2))
        .on('tick', ticked);
    }

    const dragged = (d: SNode) => {
      //alpha hit 0 it stops. make it run again
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    };

    const dragended = (d: SNode) => {
      // alpha min is 0, head there
      // simulation.alphaTarget(0);
      // d.fx = null;
      // d.fy = null;
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = d.x;
      d.fy = d.y;
    };

    //sets 'clicked' nodes back to unfixed position
    const dblClick = (d: SNode) => {
      simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    let drag = d3
      .drag<SVGGElement, SNode>()
      .on('start', function dragstarted(d: SNode) {
        d3.select(this).raise();
        // simulation.alphaTarget(0.3).restart();
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d3.event.x;
        d3.event.y;
      })
      .on('drag', dragged)
      .on('end', dragended);

    //initialize graph
    forceGraph = d3
      .select('.depends-wrapper')
      .append('svg')
      .attr('class', 'graph');

    forceGraph
      .append('svg:defs')
      .attr('class', 'arrowsGroup')
      .selectAll('marker')
      .data(['end']) // Different link/path types can be defined here
      .enter()
      .append('svg:marker') // This section adds in the arrows
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22.5)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');
    if (view === 'depends_on') {
      linkLines = forceGraph
        .append('g')
        .attr('class', 'linksGroup')
        .selectAll('line')
        .data(serviceGraph.links)
        .enter()
        .append('line')
        .attr('stroke-width', 3)
        .attr('stroke', 'pink')
        .attr('class', 'link')
        .attr('marker-end', 'url(#end)');
    }

    //create textAndNodes Group
    textsAndNodes = forceGraph
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data<SNode>(serviceGraph.nodes)
      .enter()
      .append('g')
      .on('click', (node: SNode) => {
        setSelectedContainer(node.name);
      })
      .on('dblclick', dblClick)
      .call(drag)
      .attr('fx', (d: SNode) => {
        //assign the initial x location to the relative displacement from the left
        if (view === 'depends_on')
          return (d.fx = getHorizontalPosition(d, width));
        return (d.fx = null);
      })
      .attr('fy', (d: SNode) => {
        if (view === 'depends_on')
          return (d.fy = getVerticalPosition(d, treeDepth, height));
        return (d.fy = null);
      });

    // create texts
    textsAndNodes.append('text').text((d: SNode) => d.name);

    //create container images
    textsAndNodes
      .append('svg:image')
      .attr('xlink:href', (d: SNode) => {
        return getStatic('container.svg');
      })
      .attr('height', 60)
      .attr('width', 60);

    return () => {
      forceGraph.remove();
    };
  }, [view]);

  /**
   *********************
   * PORTS OPTION TOGGLE
   *********************
   */
  useEffect(() => {
    // PORTS LOCATION
    const cx = 58;
    const cy = 18;
    const radius = 5;
    const dx = cx + radius;
    const dy = cy + radius;
    // PORTS VARIABLES
    let nodesWithPorts: d3.Selection<SVGGElement, SNode, any, any>;
    const ports: d3.Selection<SVGCircleElement, SNode, any, any>[] = [];
    const portText: d3.Selection<SVGTextElement, SNode, any, any>[] = [];
    if (options.ports) {
      // select all nodes with ports
      nodesWithPorts = d3
        .select('.nodes')
        .selectAll<SVGGElement, SNode>('g')
        .filter((d: SNode) => d.ports.length > 0);

      // iterate through all nodes with ports
      nodesWithPorts.each(function(d: SNode) {
        const node = this;
        // iterate through all ports of node
        d.ports.forEach((pString, i) => {
          // add svg port
          const port = d3
            .select<SVGElement, SNode>(node)
            .append('circle')
            .attr('class', 'port')
            .attr('cx', cx)
            .attr('cy', cy + i * 12)
            .attr('r', radius);
          // store d3 object in ports array
          ports.push(port);
          // add svg port text
          const pText = d3
            .select<SVGElement, SNode>(node)
            .append('text')
            .text(pString)
            .attr('class', 'ports-text')
            .attr('color', 'white')
            .attr('dx', dx)
            .attr('dy', dy + i * 12);
          // store d3 object in ports text array
          portText.push(pText);
        });
      });
    }

    return () => {
      // before unmoutning, if ports option was on, remove the ports
      if (options.ports) {
        ports.forEach(node => node.remove());
        portText.forEach(node => node.remove());
      }
    };
    // only fire when options.ports changes
  }, [options.ports, view]);

  /**
   *********************
   * VOLUMES OPTION TOGGLE
   *********************
   */
  useEffect(() => {
    // VOLUMES LOCATION
    const x = 8;
    const y = 20;
    const width = 10;
    const height = 10;
    // VOLUMES VARIABLES
    let nodesWithVolumes: d3.Selection<SVGGElement, SNode, any, any>;
    const volumes: d3.Selection<SVGRectElement, SNode, any, any>[] = [];
    const volumeText: d3.Selection<SVGTextElement, SNode, any, any>[] = [];
    if (options.volumes) {
      // select all nodes with volumes
      nodesWithVolumes = d3
        .select('.nodes')
        .selectAll<SVGGElement, SNode>('g')
        .filter((d: SNode) => d.volumes.length > 0);

      // iterate through all nodes with volumes
      nodesWithVolumes.each(function(d: SNode) {
        const node = this;
        // iterate through all volumes of node
        d.volumes.forEach((vString, i) => {
          let onClick = false;
          let onceClicked = false;
          // add svg volume
          const volume = d3
            .select<SVGElement, SNode>(node)
            .append('rect')
            .attr('class', 'volumeSVG')
            .attr('fill', () => {
              let slicedVString: string = colorSchemeHash(
                vString.slice(0, vString.indexOf(':')),
              );
              return slicedVString;
            })
            .attr('width', width)
            .attr('height', height)
            .attr('x', x)
            .attr('y', y + i * 12)
            .on('mouseover', () => {
              return vText.style('visibility', 'visible');
            })
            .on('mouseout', () => {
              !onClick
                ? vText.style('visibility', 'hidden')
                : vText.style('visibility', 'visible');
            })
            .on('click', () => {
              onceClicked = !onceClicked;
              onClick = onceClicked;
            });
          // store d3 object in volumes array
          volumes.push(volume);
          // add svg volume text
          const vText = d3
            .select<SVGElement, SNode>(node)
            .append('text')
            .text(vString)
            .attr('class', 'volume-text')
            .attr('fill', 'black')
            .attr('text-anchor', 'end')
            .attr('dx', x - 5)
            .attr('dy', y + (i + 1) * 11)
            .style('visibility', 'hidden');
          // store d3 object in volumes text array
          volumeText.push(vText);
        });
      });
    }

    return () => {
      // before unmounting, if volumes option was on, remove the volumes
      if (options.volumes) {
        volumes.forEach(node => node.remove());
        volumeText.forEach(node => node.remove());
      }
    };
    // only fire when options.volumes changes
  }, [options.volumes, view]);

  /**
   *********************
   * DEPENDS ON OPTION TOGGLE
   *********************
   */
  useEffect(() => {
    if (options.dependsOn) {
      d3.select('.arrowsGroup').classed('hide', false);
      d3.select('.linksGroup').classed('hide', false);
    } else {
      d3.select('.arrowsGroup').classed('hide', true);
      d3.select('.linksGroup').classed('hide', true);
    }
  }, [options.dependsOn]);

  return (
    <>
      <div className="depends-wrapper" />
    </>
  );
};

export default DependsOnView;
