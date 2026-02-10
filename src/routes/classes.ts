import express from "express";
import {db} from "../db/index.js"
import {classes, departments, subjects, user} from "../db/schema/index.js"
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {search, subject, teacher, page, limit} = req.query;

        const MAX_LIMIT = 100;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const currentPage = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
        const limitPerPage = Math.min(
            MAX_LIMIT,
            Number.isFinite(limitNum) ? Math.max(1, Math.trunc(limitNum)) : 10
        );

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(classes.name, `%${search}%`),
                    ilike(classes.inviteCode, `%${search}%`)
                )
            );
        }

        if (subject) {
            const subjectPattern = `%${String(subject).replace(/[%_\\]/g, '\\$&')}%`;
            filterConditions.push(
                ilike(subjects.name, subjectPattern)
            );
        }

        if (teacher) {
            const teacherPattern = `%${String(teacher).replace(/[%_\\]/g, '\\$&')}%`;
            filterConditions.push(
                ilike(user.name, teacherPattern)
            );
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count) || 0;

        const classesList = await db
            .select({
                ...getTableColumns(classes),
                subject: {...getTableColumns(subjects)},
                teacher: {...getTableColumns(user)}
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: classesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });

    } catch (e) {
        console.error(`GET /classes error: ${e}`);
        res.status(500).json({error: 'Failed to get classes'});
    }
});

router.get('/:id', async (req, res) => {
    const classId = Number(req.params.id);

    if (!Number.isFinite(classId)) return res.status(400).json({error: 'No Class found'});

    const [classDetails] = await db
        .select({
            ...getTableColumns(classes),
            subject: {...getTableColumns(subjects)},
            department: {...getTableColumns(departments)},
            teacher: {...getTableColumns(user)}
        })
        .from(classes)
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(classes.id, classId));

    if (!classDetails) return res.status(404).json({error: 'No Class found'});

    res.status(200).json({data: classDetails});
})

router.post('/', async (req, res) => {
    try {
        const {name, teacherId, subjectId, capacity, description, status, bannerUrl, bannerCldPubId} = req.body;
        const [createdClass] = await db
            .insert(classes)
            .values({...req.body, inviteCode: Math.random().toString(36).substring(2, 9), schedules: []})
            .returning({id: classes.id});

        if (!createdClass) throw Error;

        res.status(201).json({data: createdClass});
    } catch (e) {
        console.error(`POST /classes error ${e}`)
        res.status(500).json({error: e})
    }
})

export default router;