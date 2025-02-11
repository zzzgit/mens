# Mens

## Description
This is a cli tool designed to manage ideas. Simply creat, delete, modify, and search for idears.

## Features
- **Sync to gist**: Upload your data to gist and keep sync with it.

## Installation
To install `mens`, run cli:

```bash
npm i @zzznpm/mens -g
```

## Usage
To add an idea:

```bash
mens add 'crazy idear'
```

To list all ideas: 

```bash
mens list
```

To delete an idear:

```bash
mens remove ID
```

To modify an idea:
```bash
mens modify ID "new content"
```

## Contributing
Contributions are welcome! 

## TODO
- Try to use an emitter to improve inter-layer communication.
- Find a way to make logger and configer interdependent.
- Combining a deleted entity

## Testing
This project use mocha to test the basic functionality. To run tests, use the following command:

```bash
npm test
```
