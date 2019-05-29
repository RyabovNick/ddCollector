const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * Return distance and duration between two coordinates
 * @param {Array} from - Exm: [55.832809, 37.450958]
 * @param {Array} to - Exm: [55.827267, 37.437408]
 */
function ddCollector(from, to) {
  const options = {
    resources: 'usable',
    runScripts: 'dangerously',
  };

  const from_x = from[0];
  const from_y = from[1];
  const to_x = to[0];
  const to_y = to[1];

  JSDOM.fromFile('index.html', options).then(dom => {
    let document = dom.window.document;

    let script = document.createElement('script');
    let t = document.createTextNode(`
    ymaps.ready(getAllWays);
  
    async function getAllWays() {
      const [auto, masstransit, pedestrian, bicycle] = await Promise.all([
        getRouteInfo('auto'),
        getRouteInfo('masstransit'),
        getRouteInfo('pedestrian'),
        getRouteInfo('bicycle'),
      ]);
    
      const routeInfo = {
        auto,
        masstransit,
        pedestrian,
        bicycle,
      };
  
      // save to db here
      console.log(routeInfo);
    }
    
    function getRouteInfo(routingMode) {
      return new Promise((resolve, reject) => {
        const multiRoute = new ymaps.multiRouter.MultiRoute({
          referencePoints: [[${from_x}, ${from_y}], [${to_x}, ${to_y}]],
          params: {
            routingMode,
          },
        });
        multiRoute.model.events.add('requestsuccess', event => {
          const distance = multiRoute
            .getRoutes()
            .get(0)
            .properties.get('distance').value;
    
          const duration = multiRoute
            .getRoutes()
            .get(0)
            .properties.get('duration').value;
    
          const obj = { distance, duration };
    
          resolve(obj);
        });
      });
    }
    
    `);

    script.appendChild(t);
    document.body.appendChild(script);
  });
}

module.exports = ddCollector;
