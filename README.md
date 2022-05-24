# grabit-back
Delivery application# grabit-back




 * DEV : 

       - npm install

       - Add a config folder in source folder, inside, add a dev.env file.

       - Inside the dev.env file, add a variable "PRISMA_ENDPOINT=http://localhost:4466/grabit/dev"

       - npm run dev
       
       
 * PROD :

        - npm install

        - Add a config folder in source folder, inside, add a prod.env file.

        - Inside the prod.env file, add a variable "PRISMA_ENDPOINT=https://grabit-back-app-0e005efc37.herokuapp.com/grabit/prod"

        - In package.json file, update the script variable 'start' into "start": "env-cmd ./config/prod.env node dist/index.js"

        - npm run start
