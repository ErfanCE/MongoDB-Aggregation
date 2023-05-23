// import { readFile } from 'node:fs/promises';
import express from 'express';
import { connect, Schema, model } from 'mongoose';

await connect('mongodb://127.0.0.1:27017/aggregate');
console.log('DB connected');

const app = express();

const Tour = model(
	'Tour',
	new Schema({ startDates: [Date] }, { strict: false })
);

// * inject data to mongodb
// const data = await readFile('./tours-data.json', 'utf-8');
// const toursData = JSON.parse(data);
// await Tour.insertMany(toursData);

app.get('/', async (req, res) => {
	const tours = await Tour.find({});

	res.json({
		status: 'success',
		data: { tours }
	});
});

app.get('/stat', async (req, res) => {
	// aggregation pipeline > includes aggregation stages
	const tours = await Tour.aggregate([
		{
			$match: { price: { $gte: 500 } }
		},
		{
			$group: {
				_id: '$difficulty',
				total: { $sum: 1 },
				avgRating: { $avg: '$ratingsAverage' },
				ratingCount: { $sum: '$ratingsQuantity' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' }
			}
		},
		{
			$sort: { avgPrice: -1 }
		},
		{
			$match: { _id: { $ne: 'easy' } }
		}
	]);

	res.json({
		status: 'success',
		data: { tours }
	});
});

app.get('/stat/:year', async (req, res) => {
	const { year = 2021 } = req.params;

	const tours = await Tour.aggregate([
		{
			$unwind: '$startDates'
		},
		{
			$match: {
				startDates: {
					$lte: new Date(`${year}-12-31`),
					$gte: new Date(`${year}-01-01`)
				}
			}
		},
		{
			$group: {
				_id: { $month: '$startDates' },
				count: { $sum: 1 },
				tours: { $push: '$name' }
			}
		},
		{
			$sort: { _id: 1 }
		},
		{
			$addFields: { month: '$_id' }
		},
		{
			$project: { _id: 0 }
		}
		// { $limit: 2 }
	]);

	res.json({
		status: 'success',
		data: { tours }
	});
});

app.listen(8000, () => console.log('Listening on :8000'));
