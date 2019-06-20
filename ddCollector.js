const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// var consoleHolder = console;
// function debug(bool) {
//   if (!bool) {
//     consoleHolder = console;
//     console = {};
//     Object.keys(consoleHolder).forEach(function(key) {
//       console[key] = function() {};
//     });
//   } else {
//     console = consoleHolder;
//   }
// }
// debug(false);

/**
 * Return distance and duration between two coordinates
 * @param {Array} from - Exm: [55.832809, 37.450958]
 * @param {Array} to - Exm: [55.827267, 37.437408]
 */
function ddCollector(from, to) {
  const options = {
    resources: 'usable',
    runScripts: 'dangerously'
  };

  const [from_x, from_y] = from;
  const [to_x, to_y] = to;

  JSDOM.fromFile('index.html', options).then(dom => {
    let document = dom.window.document;

    let script = document.createElement('script');
    let t = document.createTextNode(`
    ymaps.ready(getAllWays);

    var routeInfo = {}
  
    async function getAllWays() {
      const [auto, masstransit, pedestrian, bicycle] = await Promise.all([
        getRouteInfo('auto'),
        getRouteInfo('masstransit'),
        getRouteInfo('pedestrian'),
        getRouteInfo('bicycle'),
      ]);
    
      routeInfo = {
        auto,
        masstransit,
        pedestrian,
        bicycle,
      };
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

    // необходимо подождать, пока придёт ответ с яндекса
    let interval;

    interval = setInterval(yandexResponseChecker, 100);

    function yandexResponseChecker() {
      // объект routeInfo может быть неопределен
      if (typeof dom.window.routeInfo !== 'undefined') {
        // проверяем, что данные пришли (т.е. в переменной что-то есть)
        if (
          Object.entries(dom.window.routeInfo).length !== 0 &&
          typeof dom.window.routeInfo === 'object'
        ) {
          // return here
          console.log(dom.window.routeInfo);
          clearInterval(interval);
        }
      }
    }
  });
}

module.exports = ddCollector;
