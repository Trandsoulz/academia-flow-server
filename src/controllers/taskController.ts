import { NextFunction, Request, Response } from 'express';
import Task from '../models/Task';
import catchAsync from '../utils/catchAsync';
import createError from 'http-errors';

export const getAllTasks = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tasks = await Task.find();

    res.status(200).json({
      status: 'success',
      data: tasks,
    });
  },
);

export const createTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newTask = await Task.create(req.body);

    res.status(201).json({
      status: 'success',
      data: newTask,
    });
  },
);

export const getTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(createError(404, 'Task not found'));
    }

    res.status(200).json({
      status: 'success',
      data: task,
    });
  },
);

export const updateTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return next(createError(404, 'Task not found'));
    }

    res.status(200).json({
      status: 'success',
      data: updatedTask,
    });
  },
);

export const deleteTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return next(createError(404, 'Task not found'));
    }

    res.status(204).send();
  },
);
